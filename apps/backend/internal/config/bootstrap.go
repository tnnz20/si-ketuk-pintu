package config

import (
	"context"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/delivery/http/controllers"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/delivery/http/middleware"
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

	// Repositories
	healthRepository := repository.NewDatabaseHealthRepository(database)
	administratorRepository := repository.NewAdministratorRepository(database, logger)
	visitRequestRepository := repository.NewVisitRequestRepository(database, logger)
	auditEventRepository := repository.NewAuditEventRepository(database)

	// Usecases
	healthUsecase := usecase.NewHealthUsecase(healthRepository)
	authUsecase := usecase.NewAuthUsecase(
		administratorRepository,
		applicationConfig.JWTSecret,
		applicationConfig.JWTExpiryHours,
		logger,
	)
	visitRequestUsecase := usecase.NewVisitRequestUsecase(
		visitRequestRepository,
		auditEventRepository,
		logger,
		applicationConfig.UploadDir,
		applicationConfig.TimeZone,
	)
	qrUsecase := usecase.NewQRUsecase()

	// Controllers
	healthController := controllers.NewHealthController(healthUsecase)
	visitRequestController := controllers.NewVisitRequestController(
		visitRequestUsecase,
		qrUsecase,
		logger,
		applicationConfig.TimeZone,
		applicationConfig.UploadDir,
	)
	adminAuthController := controllers.NewAdminAuthController(authUsecase, logger)
	adminRequestController := controllers.NewAdminRequestController(
		visitRequestUsecase,
		logger,
		applicationConfig.UploadDir,
	)

	// Middleware
	rateLimiter := middleware.NewRateLimiter(applicationConfig.RateLimitRPS, 20)

	// Router
	router := httproute.NewRouter(httproute.RouterDeps{
		Logger:                 logger,
		CORSOrigins:            applicationConfig.CORSOrigins,
		RateLimiter:            rateLimiter,
		AuthUsecase:            authUsecase,
		HealthController:       healthController,
		VisitRequestController: visitRequestController,
		AdminAuthController:    adminAuthController,
		AdminRequestController: adminRequestController,
	})

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
