package config

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

const defaultTimeZone = "Asia/Makassar"

type Config struct {
	Environment     string
	Host            string
	Port            int
	TimeZone        *time.Location
	DatabaseURL     string
	TestDatabaseURL string
	UploadDir       string
	LogLevel        string
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

	timeZoneName := valueOrDefault(lookup("APP_TIME_ZONE"), defaultTimeZone)
	timeZone, err := time.LoadLocation(timeZoneName)
	if err != nil {
		return Config{}, fmt.Errorf("load APP_TIME_ZONE %q: %w", timeZoneName, err)
	}

	return Config{
		Environment:     valueOrDefault(lookup("APP_ENV"), "development"),
		Host:            valueOrDefault(lookup("APP_HOST"), "0.0.0.0"),
		Port:            port,
		TimeZone:        timeZone,
		DatabaseURL:     databaseURL,
		TestDatabaseURL: strings.TrimSpace(lookup("TEST_DATABASE_URL")),
		UploadDir:       valueOrDefault(lookup("UPLOAD_DIR"), "./var/uploads"),
		LogLevel:        valueOrDefault(lookup("LOG_LEVEL"), "info"),
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
