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
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/turnstile"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
	"gorm.io/gorm"
)

// Bootstrap contains application configuration and initialized dependencies.
type Bootstrap struct {
	Config Config
	Logger *logrus.Logger
	DB     *gorm.DB
	Router *gin.Engine
}

// NewBootstrap loads configuration and constructs the logger, database
// connection, and HTTP router with all repositories, usecases, controllers,
// and middleware wired together. It returns an error if any step fails.
func NewBootstrap(ctx context.Context) (*Bootstrap, error) {
	applicationConfig, err := Load()
	if err != nil {
		return nil, fmt.Errorf("load config: %w", err)
	}

	logger, err := NewLogger(applicationConfig.LogLevel)
	if err != nil {
		return nil, fmt.Errorf("new logger: %w", err)
	}

	if mode := ginModeFor(applicationConfig.Environment); mode != "" {
		gin.SetMode(mode)
	}
	logger.WithFields(logrus.Fields{
		"environment": applicationConfig.Environment,
		"gin_mode":    gin.Mode(),
	}).Info("application environment loaded")

	database, err := OpenDatabase(ctx, applicationConfig.DatabaseURL, logger)
	if err != nil {
		return nil, err
	}

	// Repositories
	healthRepository := repository.NewDatabaseHealthRepository(database)
	administratorRepository := repository.NewAdministratorRepository(database)
	visitRequestRepository := repository.NewVisitRequestRepository(database)
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
	)
	qrUsecase := usecase.NewQRUsecase()

	var turnstileVerifier controllers.TurnstileVerifier
	if applicationConfig.TurnstileEnabled {
		turnstileVerifier = turnstile.NewVerifier(applicationConfig.TurnstileSecretKey)
	}

	// Controllers
	healthController := controllers.NewHealthController(healthUsecase)
	visitRequestController := controllers.NewVisitRequestController(
		visitRequestUsecase,
		qrUsecase,
		logger,
		applicationConfig.UploadDir,
		turnstileVerifier,
	)
	adminAuthController := controllers.NewAdminAuthController(authUsecase, logger, turnstileVerifier)
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

func ginModeFor(environment string) string {
	if environment == "production" {
		return gin.ReleaseMode
	}

	return ""
}

// Close releases the underlying database connection pool.
func (b *Bootstrap) Close() error {
	sqlDatabase, err := b.DB.DB()
	if err != nil {
		return fmt.Errorf("access sql database: %w", err)
	}

	return sqlDatabase.Close()
}
