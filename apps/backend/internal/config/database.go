package config

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

type gormLogWriter struct {
	logger *logrus.Logger
}

func (w gormLogWriter) Printf(message string, values ...interface{}) {
	w.logger.WithField("component", "gorm").Debugf(message, values...)
}

func OpenDatabase(ctx context.Context, databaseURL string, logger *logrus.Logger) (*gorm.DB, error) {
	gormLogger := gormlogger.New(
		gormLogWriter{logger: logger},
		gormlogger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  gormlogger.Warn,
			IgnoreRecordNotFoundError: true,
			ParameterizedQueries:      true,
			Colorful:                  false,
		},
	)

	database, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	sqlDatabase, err := database.DB()
	if err != nil {
		return nil, fmt.Errorf("access sql database: %w", err)
	}

	if err := sqlDatabase.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("ping database: %w", err)
	}

	return database, nil
}
