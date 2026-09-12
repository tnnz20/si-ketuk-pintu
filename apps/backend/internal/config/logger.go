package config

import (
	"fmt"
	"os"

	"github.com/sirupsen/logrus"
)

// NewLogger creates a logrus logger writing JSON to stdout at the given
// level (e.g. "info", "debug"). Invalid levels return an error.
func NewLogger(level string) (*logrus.Logger, error) {
	parsedLevel, err := logrus.ParseLevel(level)
	if err != nil {
		return nil, fmt.Errorf("parse LOG_LEVEL: %w", err)
	}

	logger := logrus.New()
	logger.SetOutput(os.Stdout)
	logger.SetLevel(parsedLevel)
	logger.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: "2006-01-02T15:04:05.000Z07:00",
	})

	return logger, nil
}
