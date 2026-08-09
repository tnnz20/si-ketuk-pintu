package config

import (
	"context"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/delivery/http/controllers"
	httproute "github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/delivery/http/route"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
	"gorm.io/gorm"
)

type Bootstrap struct {
	Config Config
	Logger *logrus.Logger
	DB     *gorm.DB
	Router *gin.Engine
}

func NewBootstrap(ctx context.Context) (*Bootstrap, error) {
	applicationConfig, err := Load()
	if err != nil {
		return nil, err
	}

	logger, err := NewLogger(applicationConfig.LogLevel)
	if err != nil {
		return nil, err
	}

	database, err := OpenDatabase(ctx, applicationConfig.DatabaseURL, logger)
	if err != nil {
		return nil, err
	}

	healthRepository := repository.NewDatabaseHealthRepository(database)
	healthUsecase := usecase.NewHealthUsecase(healthRepository)
	healthController := controllers.NewHealthController(healthUsecase)
	router := httproute.NewRouter(logger, healthController)

	return &Bootstrap{
		Config: applicationConfig,
		Logger: logger,
		DB:     database,
		Router: router,
	}, nil
}

func (b *Bootstrap) Close() error {
	sqlDatabase, err := b.DB.DB()
	if err != nil {
		return fmt.Errorf("access sql database: %w", err)
	}

	return sqlDatabase.Close()
}
