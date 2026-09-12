package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/ssh"
)

// DatabaseConfig holds PostgreSQL connection settings read from
// POSTGRES_* environment variables.
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// GetDSN returns the key-value DSN string for the database connection.
func (c DatabaseConfig) GetDSN() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s", c.Host, c.Port, c.User, c.Password, c.DBName, c.SSLMode)
}

// GetURL returns the PostgreSQL connection URL for the database.
func (c DatabaseConfig) GetURL() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", c.User, c.Password, c.Host, c.Port, c.DBName, c.SSLMode)
}

// Config holds all application settings loaded from environment variables.
type Config struct {
	Environment        string
	Host               string
	Port               int
	DatabaseURL        string
	TestDatabaseURL    string
	Database           DatabaseConfig
	TestDatabase       DatabaseConfig
	UploadDir          string
	LogLevel           string
	JWTSecret          string
	JWTExpiryHours     int
	CORSOrigins        []string
	RateLimitRPS       float64
	TurnstileSiteKey   string
	TurnstileSecretKey string
	TurnstileEnabled   bool
	SSH                ssh.TunnelConfig
}

// Load reads configuration from environment variables, optionally filling
// in defaults from a .env file. It returns an error if required variables
// are missing or invalid.
func Load() (Config, error) {
	_ = godotenv.Load()

	return load(os.Getenv)
}

// HTTPAddress returns the host:port address the HTTP server should listen on.
func (c Config) HTTPAddress() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

func databaseConfig(lookup func(string) string, prefix string) DatabaseConfig {
	return DatabaseConfig{
		Host:     valueOrDefault(lookup(prefix+"_HOST"), "localhost"),
		Port:     valueOrDefault(lookup(prefix+"_PORT"), "5432"),
		User:     lookup(prefix + "_USER"),
		Password: lookup(prefix + "_PASSWORD"),
		DBName:   lookup(prefix + "_DB"),
		SSLMode:  valueOrDefault(lookup(prefix+"_SSLMODE"), "disable"),
	}
}

func load(lookup func(string) string) (Config, error) {
	database := databaseConfig(lookup, "POSTGRES")
	if database.Host == "" || database.Port == "" || database.User == "" || database.DBName == "" {
		return Config{}, fmt.Errorf("POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, and POSTGRES_DB are required")
	}

	port, err := parsePort(lookup("APP_PORT"))
	if err != nil {
		return Config{}, err
	}

	jwtSecret := strings.TrimSpace(lookup("JWT_SECRET"))
	if jwtSecret == "" {
		return Config{}, fmt.Errorf("JWT_SECRET is required")
	}

	jwtExpiryHours, err := parsePositiveInt(lookup("JWT_EXPIRY_HOURS"), 24)
	if err != nil {
		return Config{}, fmt.Errorf("parse JWT_EXPIRY_HOURS: %w", err)
	}

	corsOrigins := parseCORSOrigins(lookup("CORS_ORIGINS"))

	rateLimitRPS, err := parseFloat(lookup("RATE_LIMIT_RPS"), 10.0)
	if err != nil {
		return Config{}, fmt.Errorf("parse RATE_LIMIT_RPS: %w", err)
	}

	testDatabase := databaseConfig(lookup, "TEST_POSTGRES")
	databaseURL := database.GetURL()
	testDatabaseURL := ""
	if testDatabase.DBName != "" {
		testDatabaseURL = testDatabase.GetURL()
	}

	environment := valueOrDefault(lookup("APP_ENV"), "development")
	turnstileSiteKey := strings.TrimSpace(lookup("TURNSTILE_SITE_KEY"))
	turnstileSecretKey := strings.TrimSpace(lookup("TURNSTILE_SECRET_KEY"))
	turnstileEnabled := environment == "production"
	if turnstileEnabled && (turnstileSiteKey == "" || turnstileSecretKey == "") {
		return Config{}, fmt.Errorf("TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY are required when APP_ENV is production")
	}

	sshTunnel := ssh.TunnelConfig{
		Host:       strings.TrimSpace(lookup("SSH_HOST")),
		Port:       valueOrDefault(lookup("SSH_PORT"), "22"),
		User:       strings.TrimSpace(lookup("SSH_USER")),
		Password:   lookup("SSH_PASSWORD"),
		KnownHosts: strings.TrimSpace(lookup("SSH_KNOWN_HOSTS_FILE")),
		DBHost:     valueOrDefault(lookup("SSH_POSTGRES_HOST"), "127.0.0.1"),
		DBPort:     valueOrDefault(lookup("SSH_POSTGRES_PORT"), "5432"),
		DBUser:     strings.TrimSpace(lookup("SSH_POSTGRES_USER")),
		DBPassword: lookup("SSH_POSTGRES_PASSWORD"),
		DBName:     strings.TrimSpace(lookup("SSH_POSTGRES_DATABASE")),
		DBSSLMode:  valueOrDefault(lookup("SSH_POSTGRES_SSLMODE"), "disable"),
	}

	return Config{
		Environment:        environment,
		Host:               valueOrDefault(lookup("APP_HOST"), "0.0.0.0"),
		Port:               port,
		DatabaseURL:        databaseURL,
		TestDatabaseURL:    testDatabaseURL,
		Database:           database,
		TestDatabase:       testDatabase,
		UploadDir:          valueOrDefault(lookup("UPLOAD_DIR"), "./var/uploads"),
		LogLevel:           valueOrDefault(lookup("LOG_LEVEL"), "info"),
		JWTSecret:          jwtSecret,
		JWTExpiryHours:     jwtExpiryHours,
		CORSOrigins:        corsOrigins,
		RateLimitRPS:       rateLimitRPS,
		TurnstileSiteKey:   turnstileSiteKey,
		TurnstileSecretKey: turnstileSecretKey,
		TurnstileEnabled:   turnstileEnabled,
		SSH:                sshTunnel,
	}, nil
}

// ValidateSSHTunnelConfig returns an error when required SSH tunnel settings
// are missing. It is called only when a command opts into SSH tunneling.
func ValidateSSHTunnelConfig(tunnel ssh.TunnelConfig) error {
	return ssh.ValidateTunnelConfig(tunnel)
}

func parsePort(value string) (int, error) {
	if strings.TrimSpace(value) == "" {
		return 8080, nil
	}

	port, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("parse APP_PORT: %w", err)
	}

	if port < 1 || port > 65535 {
		return 0, fmt.Errorf("APP_PORT must be between 1 and 65535")
	}

	return port, nil
}

func valueOrDefault(value string, fallback string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback
	}

	return value
}

func parsePositiveInt(value string, fallback int) (int, error) {
	if strings.TrimSpace(value) == "" {
		return fallback, nil
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, err
	}

	if parsed < 1 {
		return 0, fmt.Errorf("value must be positive, got %d", parsed)
	}

	return parsed, nil
}

func parseFloat(value string, fallback float64) (float64, error) {
	if strings.TrimSpace(value) == "" {
		return fallback, nil
	}

	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return 0, err
	}

	return parsed, nil
}

func parseCORSOrigins(value string) []string {
	value = strings.TrimSpace(value)
	if value == "" {
		return []string{"*"}
	}

	origins := strings.Split(value, ",")
	result := make([]string, 0, len(origins))
	for _, origin := range origins {
		trimmed := strings.TrimSpace(origin)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}

	if len(result) == 0 {
		return []string{"*"}
	}

	return result
}
