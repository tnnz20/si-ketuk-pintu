package config

import (
	"strings"
	"testing"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/ssh"
)

func TestLoadRejectsMissingDatabaseConfig(t *testing.T) {
	t.Parallel()

	_, err := load(func(string) string { return "" })
	if err == nil {
		t.Fatal("load config should reject missing database config")
	}
}

func TestLoadRejectsInvalidPort(t *testing.T) {
	t.Parallel()

	_, err := load(func(key string) string {
		switch key {
		case "POSTGRES_USER":
			return "skp"
		case "POSTGRES_DB":
			return "si_ketuk_pintu"
		case "POSTGRES_PORT":
			return "5432"
		case "APP_PORT":
			return "invalid"
		case "JWT_SECRET":
			return "test-secret"
		default:
			return ""
		}
	})
	if err == nil {
		t.Fatal("load config should reject an invalid APP_PORT")
	}
}

func TestLoadBuildsDatabaseDSN(t *testing.T) {
	t.Parallel()

	config, err := load(func(key string) string {
		values := map[string]string{
			"POSTGRES_HOST":     "localhost",
			"POSTGRES_PORT":     "5432",
			"POSTGRES_USER":     "skp",
			"POSTGRES_PASSWORD": "password",
			"POSTGRES_DB":       "si_ketuk_pintu",
			"POSTGRES_SSLMODE":  "disable",
			"JWT_SECRET":        "test-secret",
		}
		return values[key]
	})
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if config.Database.GetDSN() != "host=localhost port=5432 user=skp password=password dbname=si_ketuk_pintu sslmode=disable" {
		t.Fatalf("unexpected DSN: %s", config.Database.GetDSN())
	}
}

func TestLoadRejectsMissingTurnstileKeysInProduction(t *testing.T) {
	t.Parallel()

	_, err := load(func(key string) string {
		values := map[string]string{
			"POSTGRES_USER":      "skp",
			"POSTGRES_DB":        "si_ketuk_pintu",
			"JWT_SECRET":         "test-secret",
			"APP_ENV":            "production",
			"TURNSTILE_SITE_KEY": "site",
		}
		return values[key]
	})
	if err == nil {
		t.Fatal("load config should reject production config without TURNSTILE_SECRET_KEY")
	}

	_, err = load(func(key string) string {
		values := map[string]string{
			"POSTGRES_USER":        "skp",
			"POSTGRES_DB":          "si_ketuk_pintu",
			"JWT_SECRET":           "test-secret",
			"APP_ENV":              "production",
			"TURNSTILE_SECRET_KEY": "secret",
		}
		return values[key]
	})
	if err == nil {
		t.Fatal("load config should reject production config without TURNSTILE_SITE_KEY")
	}
}

func TestLoadTurnstileEnabledOnlyInProduction(t *testing.T) {
	t.Parallel()

	config, err := load(func(key string) string {
		values := map[string]string{
			"POSTGRES_USER":        "skp",
			"POSTGRES_DB":          "si_ketuk_pintu",
			"JWT_SECRET":           "test-secret",
			"APP_ENV":              "production",
			"TURNSTILE_SITE_KEY":   "site",
			"TURNSTILE_SECRET_KEY": "secret",
		}
		return values[key]
	})
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if !config.TurnstileEnabled {
		t.Fatal("turnstile should be enabled when APP_ENV is production with keys set")
	}

	devConfig, err := load(func(key string) string {
		values := map[string]string{
			"POSTGRES_USER": "skp",
			"POSTGRES_DB":   "si_ketuk_pintu",
			"JWT_SECRET":    "test-secret",
			"APP_ENV":       "development",
		}
		return values[key]
	})
	if err != nil {
		t.Fatalf("load development config: %v", err)
	}
	if devConfig.TurnstileEnabled {
		t.Fatal("turnstile should be disabled outside production")
	}
}

func TestValidateSSHTunnelConfigAcceptsCompleteConfig(t *testing.T) {
	t.Parallel()

	err := ValidateSSHTunnelConfig(ssh.TunnelConfig{
		Host:       "bastion.example.com",
		Port:       "22",
		User:       "deploy",
		Password:   "secret",
		KnownHosts: "/home/deploy/.ssh/known_hosts",
		DBHost:     "127.0.0.1",
		DBPort:     "5432",
		DBUser:     "skp",
		DBPassword: "dbsecret",
		DBName:     "si_ketuk_pintu",
		DBSSLMode:  "disable",
	})
	if err != nil {
		t.Fatalf("complete SSH tunnel config should be valid: %v", err)
	}
}

func TestValidateSSHTunnelConfigRejectsMissingRequiredValues(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name     string
		envName  string
		mutate   func(*ssh.TunnelConfig)
		expected string
	}{
		{"missing host", "SSH_HOST", func(c *ssh.TunnelConfig) { c.Host = "" }, "SSH_HOST"},
		{"missing user", "SSH_USER", func(c *ssh.TunnelConfig) { c.User = "" }, "SSH_USER"},
		{"missing password", "SSH_PASSWORD", func(c *ssh.TunnelConfig) { c.Password = "" }, "SSH_PASSWORD"},
		{"missing known hosts", "SSH_KNOWN_HOSTS_FILE", func(c *ssh.TunnelConfig) { c.KnownHosts = "" }, "SSH_KNOWN_HOSTS_FILE"},
		{"missing database user", "SSH_POSTGRES_USER", func(c *ssh.TunnelConfig) { c.DBUser = "" }, "SSH_POSTGRES_USER"},
		{"missing database name", "SSH_POSTGRES_DATABASE", func(c *ssh.TunnelConfig) { c.DBName = "" }, "SSH_POSTGRES_DATABASE"},
	}

	for _, testCase := range cases {
		config := ssh.TunnelConfig{
			Host:       "bastion.example.com",
			Port:       "22",
			User:       "deploy",
			Password:   "secret",
			KnownHosts: "/home/deploy/.ssh/known_hosts",
			DBHost:     "127.0.0.1",
			DBPort:     "5432",
			DBUser:     "skp",
			DBPassword: "dbsecret",
			DBName:     "si_ketuk_pintu",
			DBSSLMode:  "disable",
		}
		testCase.mutate(&config)

		err := ValidateSSHTunnelConfig(config)
		if err == nil {
			t.Fatalf("%s should be required for SSH tunneling", testCase.envName)
		}
		if !strings.Contains(err.Error(), testCase.expected) {
			t.Fatalf("error %q should mention %s", err.Error(), testCase.expected)
		}
	}
}

func TestLoadAppliesSSHTunnelDefaults(t *testing.T) {
	t.Parallel()

	config, err := load(func(key string) string {
		values := map[string]string{
			"POSTGRES_HOST": "localhost",
			"POSTGRES_PORT": "5432",
			"POSTGRES_USER": "skp",
			"POSTGRES_DB":   "si_ketuk_pintu",
			"JWT_SECRET":    "test-secret",
		}
		return values[key]
	})
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if config.SSH.Port != "22" {
		t.Fatalf("SSH port default = %q, want 22", config.SSH.Port)
	}
	if config.SSH.DBHost != "127.0.0.1" {
		t.Fatalf("SSH database host default = %q, want 127.0.0.1", config.SSH.DBHost)
	}
	if config.SSH.DBPort != "5432" {
		t.Fatalf("SSH database port default = %q, want 5432", config.SSH.DBPort)
	}
	if config.SSH.DBSSLMode != "disable" {
		t.Fatalf("SSH database sslmode default = %q, want disable", config.SSH.DBSSLMode)
	}
}

func TestLoadReadsSSHTunnelEnvironment(t *testing.T) {
	t.Parallel()

	config, err := load(func(key string) string {
		values := map[string]string{
			"POSTGRES_HOST":         "localhost",
			"POSTGRES_PORT":         "5432",
			"POSTGRES_USER":         "skp",
			"POSTGRES_DB":           "si_ketuk_pintu",
			"JWT_SECRET":            "test-secret",
			"SSH_HOST":              "bastion.example.com",
			"SSH_PORT":              "2222",
			"SSH_USER":              "deploy",
			"SSH_PASSWORD":          "secret",
			"SSH_KNOWN_HOSTS_FILE":  "/home/deploy/.ssh/known_hosts",
			"SSH_POSTGRES_HOST":     "db.internal",
			"SSH_POSTGRES_PORT":     "6543",
			"SSH_POSTGRES_DATABASE": "si_ketuk_pintu",
			"SSH_POSTGRES_USER":     "skp",
			"SSH_POSTGRES_PASSWORD": "dbsecret",
			"SSH_POSTGRES_SSLMODE":  "require",
		}
		return values[key]
	})
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if config.SSH.Host != "bastion.example.com" || config.SSH.Port != "2222" {
		t.Fatalf("unexpected SSH server endpoint: %s:%s", config.SSH.Host, config.SSH.Port)
	}
	if config.SSH.User != "deploy" || config.SSH.Password != "secret" {
		t.Fatalf("unexpected SSH credentials")
	}
	if config.SSH.KnownHosts != "/home/deploy/.ssh/known_hosts" {
		t.Fatalf("unexpected known hosts path: %s", config.SSH.KnownHosts)
	}
	if config.SSH.DBHost != "db.internal" || config.SSH.DBPort != "6543" {
		t.Fatalf("unexpected remote database endpoint: %s:%s", config.SSH.DBHost, config.SSH.DBPort)
	}
	if config.SSH.DBName != "si_ketuk_pintu" || config.SSH.DBUser != "skp" || config.SSH.DBPassword != "dbsecret" {
		t.Fatalf("unexpected remote database credentials")
	}
	if config.SSH.DBSSLMode != "require" {
		t.Fatalf("unexpected remote database sslmode: %s", config.SSH.DBSSLMode)
	}
}

func TestLoadRejectsMissingJWTSecret(t *testing.T) {
	t.Parallel()

	_, err := load(func(key string) string {
		if key == "POSTGRES_USER" {
			return "skp"
		}
		if key == "POSTGRES_DB" {
			return "si_ketuk_pintu"
		}
		return ""
	})
	if err == nil {
		t.Fatal("load config should reject a missing JWT_SECRET")
	}
}
