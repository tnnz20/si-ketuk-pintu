package config

import (
	"fmt"
	"os"

	"github.com/sirupsen/logrus"
)

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
