// Package ssh provides a password-authenticated SSH tunnel used by
// migration and seeder commands to reach PostgreSQL behind a bastion host.
package ssh

import (
	"context"
	"fmt"
	"io"
	"net"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	gossh "golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/knownhosts"
)

// TunnelConfig holds SSH server and remote PostgreSQL settings loaded from
// environment variables. Passwords are held in memory only and never logged.
type TunnelConfig struct {
	Host       string
	Port       string
	User       string
	Password   string
	KnownHosts string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
}

// Tunnel is a local SSH port forward. Use StartTunnel to create one.
// listener and client are non-nil and read-only; only their close state
// changes, guarded by closeOnce.
type Tunnel struct {
	config    TunnelConfig
	listener  net.Listener
	client    *gossh.Client
	closeOnce sync.Once
}

// StartTunnel validates its configuration, connects to the SSH server with
// mandatory host-key verification, and starts listening on 127.0.0.1 only.
func StartTunnel(ctx context.Context, config TunnelConfig) (*Tunnel, error) {
	if config.Host == "" || config.Port == "" || config.User == "" || config.KnownHosts == "" {
		return nil, fmt.Errorf("SSH_HOST, SSH_PORT, SSH_USER, and SSH_KNOWN_HOSTS_FILE are required")
	}
	if config.DBHost == "" || config.DBPort == "" {
		return nil, fmt.Errorf("SSH_POSTGRES_HOST and SSH_POSTGRES_PORT are required")
	}

	hostKeyCallback, err := knownhosts.New(config.KnownHosts)
	if err != nil {
		return nil, fmt.Errorf("load known hosts %q: %w", config.KnownHosts, err)
	}

	sshPort, err := strconv.Atoi(config.Port)
	if err != nil || sshPort < 1 || sshPort > 65535 {
		return nil, fmt.Errorf("SSH_PORT must be a port number, got %q", config.Port)
	}
	dbPort, err := strconv.Atoi(config.DBPort)
	if err != nil || dbPort < 1 || dbPort > 65535 {
		return nil, fmt.Errorf("SSH_POSTGRES_PORT must be a port number, got %q", config.DBPort)
	}

	sshClient, err := gossh.Dial("tcp", net.JoinHostPort(config.Host, config.Port), &gossh.ClientConfig{
		User:            config.User,
		Auth:            []gossh.AuthMethod{gossh.Password(config.Password)},
		HostKeyCallback: hostKeyCallback,
		Timeout:         dialTimeout,
	})
	if err != nil {
		return nil, fmt.Errorf("connect to SSH server %s:%d as %q: %w", config.Host, sshPort, config.User, err)
	}

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		sshClient.Close()
		return nil, fmt.Errorf("listen on loopback: %w", err)
	}

	tunnel := &Tunnel{config: config, listener: listener, client: sshClient}
	go tunnel.acceptLoop()
	go func() {
		<-ctx.Done()
		tunnel.Close()
	}()

	return tunnel, nil
}

const dialTimeout = 15 * time.Second

// LocalEndpoint returns the loopback host and port the tunnel forwards from.
func (t *Tunnel) LocalEndpoint() (string, int) {
	address := t.listener.Addr().(*net.TCPAddr)
	return address.IP.String(), address.Port
}

// DatabaseURL builds a PostgreSQL URL pointing at the local tunnel endpoint.
// Credentials and database name are percent-encoded.
func (t *Tunnel) DatabaseURL() string {
	_, port := t.LocalEndpoint()
	endpoint := url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(t.config.DBUser, t.config.DBPassword),
		Host:   net.JoinHostPort("127.0.0.1", strconv.Itoa(port)),
		Path:   "/" + t.config.DBName,
	}
	query := url.Values{"sslmode": {t.config.DBSSLMode}}
	endpoint.RawQuery = query.Encode()
	return endpoint.String()
}

// Close stops accepting connections, closes the SSH session, and releases
// the loopback listener. It is safe to call more than once and concurrently.
func (t *Tunnel) Close() error {
	var err error
	t.closeOnce.Do(func() {
		err = t.listener.Close()
		if clientErr := t.client.Close(); err == nil {
			err = clientErr
		}
	})
	return err
}

func (t *Tunnel) acceptLoop() {
	for {
		local, err := t.listener.Accept()
		if err != nil {
			return
		}
		go t.forward(local)
	}
}

func (t *Tunnel) forward(local net.Conn) {
	defer local.Close()

	remote, err := t.client.Dial("tcp", net.JoinHostPort(t.config.DBHost, t.config.DBPort))
	if err != nil {
		return
	}
	defer remote.Close()

	done := make(chan struct{}, 2)
	copyThenClose := func(dst net.Conn, src net.Conn) {
		_, _ = io.Copy(dst, src)
		_ = dst.Close()
		done <- struct{}{}
	}
	go copyThenClose(remote, local)
	go copyThenClose(local, remote)
	<-done
}

// RunWithTunnel validates the SSH configuration, opens a tunnel, runs fn with
// the tunneled database URL, and always closes the tunnel before returning.
// Errors never include SSH or database passwords.
func RunWithTunnel(ctx context.Context, config TunnelConfig, fn func(databaseURL string) error) error {
	if err := ValidateTunnelConfig(config); err != nil {
		return err
	}

	tunnel, err := StartTunnel(ctx, config)
	if err != nil {
		return err
	}
	defer tunnel.Close()

	return fn(tunnel.DatabaseURL())
}

// ValidateTunnelConfig returns an error when required tunnel settings are
// missing. Commands call it before opening any connection.
func ValidateTunnelConfig(config TunnelConfig) error {
	required := []struct {
		name  string
		value string
	}{
		{"SSH_HOST", config.Host},
		{"SSH_PORT", config.Port},
		{"SSH_USER", config.User},
		{"SSH_PASSWORD", config.Password},
		{"SSH_KNOWN_HOSTS_FILE", config.KnownHosts},
		{"SSH_POSTGRES_HOST", config.DBHost},
		{"SSH_POSTGRES_PORT", config.DBPort},
		{"SSH_POSTGRES_USER", config.DBUser},
		{"SSH_POSTGRES_DATABASE", config.DBName},
		{"SSH_POSTGRES_SSLMODE", config.DBSSLMode},
	}
	for _, field := range required {
		if field.value == "" {
			return fmt.Errorf("%s is required for SSH tunneling", field.name)
		}
	}

	return nil
}

// ParseSSHFlag reports whether args contain the standalone --ssh flag and
// returns the remaining arguments. --ssh must appear before the command word
// and takes no value.
func ParseSSHFlag(args []string) (enabled bool, rest []string, err error) {
	for i, arg := range args {
		switch arg {
		case "--ssh":
			return true, append(args[:i:i], args[i+1:]...), nil
		case "--":
			return false, args, nil
		default:
			if strings.HasPrefix(arg, "-") {
				return false, nil, fmt.Errorf("unknown flag %q (only --ssh is supported)", arg)
			}
			return false, args, nil
		}
	}
	return false, args, nil
}
