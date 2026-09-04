package config

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Environment     string
	Host            string
	Port            int
	DatabaseURL     string
	TestDatabaseURL string
	UploadDir       string
	LogLevel        string
	JWTSecret       string
	JWTExpiryHours  int
	CORSOrigins     []string
	RateLimitRPS    float64
}

func Load() (Config, error) {
	_ = godotenv.Load()

	return load(os.Getenv)
}

func (c Config) HTTPAddress() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

func load(lookup func(string) string) (Config, error) {
	databaseURL := strings.TrimSpace(lookup("DATABASE_URL"))
	if databaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}

	if _, err := url.ParseRequestURI(databaseURL); err != nil {
		return Config{}, fmt.Errorf("parse DATABASE_URL: %w", err)
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

	return Config{
		Environment:     valueOrDefault(lookup("APP_ENV"), "development"),
		Host:            valueOrDefault(lookup("APP_HOST"), "0.0.0.0"),
		Port:            port,
		DatabaseURL:     databaseURL,
		TestDatabaseURL: strings.TrimSpace(lookup("TEST_DATABASE_URL")),
		UploadDir:       valueOrDefault(lookup("UPLOAD_DIR"), "./var/uploads"),
		LogLevel:        valueOrDefault(lookup("LOG_LEVEL"), "info"),
		JWTSecret:       jwtSecret,
		JWTExpiryHours:  jwtExpiryHours,
		CORSOrigins:     corsOrigins,
		RateLimitRPS:    rateLimitRPS,
	}, nil
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

