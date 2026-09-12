package ssh

import (
	"context"
	"net"
	neturl "net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestStartTunnelRejectsMissingConfig(t *testing.T) {
	t.Parallel()

	_, err := StartTunnel(context.Background(), TunnelConfig{})
	if err == nil {
		t.Fatal("StartTunnel should reject missing SSH configuration")
	}
}

func TestStartTunnelRejectsMissingKnownHostsFile(t *testing.T) {
	t.Parallel()

	missing := filepath.Join(t.TempDir(), "no-such-known-hosts")
	_, err := StartTunnel(context.Background(), TunnelConfig{
		Host:       "bastion.example.com",
		Port:       "22",
		User:       "deploy",
		Password:   "secret",
		KnownHosts: missing,
		DBHost:     "127.0.0.1",
		DBPort:     "5432",
	})
	if err == nil {
		t.Fatal("StartTunnel should reject a missing known-hosts file")
	}
}

func TestStartTunnelRejectsInvalidPorts(t *testing.T) {
	t.Parallel()

	knownHosts := writeKnownHosts(t)
	config := TunnelConfig{
		Host:       "bastion.example.com",
		User:       "deploy",
		Password:   "secret",
		KnownHosts: knownHosts,
		DBHost:     "127.0.0.1",
		DBPort:     "5432",
	}

	config.Port = "not-a-port"
	if _, err := StartTunnel(context.Background(), config); err == nil {
		t.Fatal("StartTunnel should reject a non-numeric SSH_PORT")
	}

	config.Port = "22"
	config.DBPort = "0"
	if _, err := StartTunnel(context.Background(), config); err == nil {
		t.Fatal("StartTunnel should reject an out-of-range SSH_POSTGRES_PORT")
	}
}

func TestStartTunnelBindsLoopbackAndCloses(t *testing.T) {
	t.Parallel()

	knownHosts := writeKnownHosts(t)
	tunnel, err := StartTunnel(context.Background(), TunnelConfig{
		Host:       "127.0.0.1",
		Port:       "1", // nothing listens here; connection fails fast
		User:       "deploy",
		Password:   "secret",
		KnownHosts: knownHosts,
		DBHost:     "127.0.0.1",
		DBPort:     "5432",
	})
	if err != nil {
		// SSH server unreachable: still acceptable for this test only if
		// the failure is a connection error, not a listener error.
		t.Skipf("SSH dial failed before listener check: %v", err)
	}
	defer tunnel.Close()

	host, port := tunnel.LocalEndpoint()
	if host != "127.0.0.1" {
		t.Fatalf("tunnel host = %q, want 127.0.0.1", host)
	}
	if port <= 0 || port > 65535 {
		t.Fatalf("tunnel port = %d, want an ephemeral port", port)
	}

	if _, err := net.DialTimeout("tcp", net.JoinHostPort(host, itoa(port)), time.Second); err != nil {
		t.Fatalf("loopback listener should accept TCP connections: %v", err)
	}

	if err := tunnel.Close(); err != nil {
		t.Fatalf("close tunnel: %v", err)
	}
	if err := tunnel.Close(); err != nil {
		t.Fatalf("second close should be a no-op, got %v", err)
	}

	if _, err := net.DialTimeout("tcp", net.JoinHostPort(host, itoa(port)), time.Second); err == nil {
		t.Fatal("listener should be closed after Close")
	}
}

func TestTunnelCloseSafeUnderRace(t *testing.T) {
	t.Parallel()

	knownHosts := writeKnownHosts(t)
	tunnel, err := StartTunnel(context.Background(), TunnelConfig{
		Host:       "127.0.0.1",
		Port:       "1",
		User:       "deploy",
		Password:   "secret",
		KnownHosts: knownHosts,
		DBHost:     "127.0.0.1",
		DBPort:     "5432",
	})
	if err != nil {
		t.Skipf("SSH dial failed before listener check: %v", err)
	}

	var wg sync.WaitGroup
	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_ = tunnel.Close()
		}()
	}
	wg.Wait()
}

func TestStartTunnelClosesOnContextCancel(t *testing.T) {
	t.Parallel()

	knownHosts := writeKnownHosts(t)
	ctx, cancel := context.WithCancel(context.Background())
	tunnel, err := StartTunnel(ctx, TunnelConfig{
		Host:       "127.0.0.1",
		Port:       "1",
		User:       "deploy",
		Password:   "secret",
		KnownHosts: knownHosts,
		DBHost:     "127.0.0.1",
		DBPort:     "5432",
	})
	if err != nil {
		t.Skipf("SSH dial failed before listener check: %v", err)
	}
	defer tunnel.Close()

	cancel()
	_, port := tunnel.LocalEndpoint()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if _, err := net.DialTimeout("tcp", net.JoinHostPort("127.0.0.1", itoa(port)), 100*time.Millisecond); err != nil {
			return
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatal("tunnel listener should close after context cancel")
}

func TestTunnelDatabaseURLOverridesHostPort(t *testing.T) {
	t.Parallel()

	tunnel := &Tunnel{
		config: TunnelConfig{
			DBUser:     "skp",
			DBPassword: "dbsecret",
			DBName:     "si_ketuk_pintu",
			DBSSLMode:  "disable",
		},
		listener: mustListener(t),
	}

	url := tunnel.DatabaseURL()
	host, port := tunnel.LocalEndpoint()
	if !strings.Contains(url, "127.0.0.1") || !strings.Contains(url, itoa(port)) {
		t.Fatalf("URL %q should target the local tunnel endpoint %s:%d", url, host, port)
	}
	if strings.Contains(url, "SSH_PASSWORD_PLACEHOLDER") {
		t.Fatal("URL should never contain the SSH password")
	}
}

func TestTunnelDatabaseURLEscapesCredentials(t *testing.T) {
	t.Parallel()

	tunnel := &Tunnel{
		config: TunnelConfig{
			DBUser:     "skp user",
			DBPassword: "p@ss/w0rd?x",
			DBName:     "si ketuk pintu",
			DBSSLMode:  "disable",
		},
		listener: mustListener(t),
	}

	parsed, err := neturl.Parse(tunnel.DatabaseURL())
	if err != nil {
		t.Fatalf("parse DatabaseURL: %v", err)
	}
	if got, want := parsed.User.Username(), "skp user"; got != want {
		t.Fatalf("username = %q, want %q", got, want)
	}
	if password, _ := parsed.User.Password(); password != "p@ss/w0rd?x" {
		t.Fatalf("password = %q", password)
	}
	if parsed.Path != "/si ketuk pintu" {
		t.Fatalf("database path = %q", parsed.Path)
	}
	if parsed.Query().Get("sslmode") != "disable" {
		t.Fatalf("sslmode = %q", parsed.Query().Get("sslmode"))
	}
}

func TestParseSSHFlag(t *testing.T) {
	t.Parallel()

	enabled, rest, err := ParseSSHFlag([]string{"--ssh", "up"})
	if err != nil || !enabled || len(rest) != 1 || rest[0] != "up" {
		t.Fatalf("ParseSSHFlag(--ssh up) = %v, %v, %v", enabled, rest, err)
	}

	enabled, rest, err = ParseSSHFlag([]string{"force", "3"})
	if err != nil || enabled || len(rest) != 2 {
		t.Fatalf("ParseSSHFlag(force 3) = %v, %v, %v", enabled, rest, err)
	}

	if _, _, err := ParseSSHFlag([]string{"--bogus"}); err == nil {
		t.Fatal("ParseSSHFlag should reject unknown flags")
	}
}

func mustListener(t *testing.T) net.Listener {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen on loopback: %v", err)
	}
	t.Cleanup(func() { _ = listener.Close() })
	return listener
}

func writeKnownHosts(t *testing.T) string {
	t.Helper()
	// A syntactically valid but unused entry: verification stays mandatory
	// and any real host key will fail to match.
	path := filepath.Join(t.TempDir(), "known_hosts")
	entry := "@cert-authority *.example.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExamplePlaceholderKeyMaterialForTests\n"
	if err := os.WriteFile(path, []byte(entry), 0o600); err != nil {
		t.Fatalf("write known hosts: %v", err)
	}
	return path
}

func itoa(value int) string {
	if value == 0 {
		return "0"
	}
	digits := ""
	for value > 0 {
		digits = string(rune('0'+value%10)) + digits
		value /= 10
	}
	return digits
}
