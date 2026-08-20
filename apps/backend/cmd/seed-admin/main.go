package main

import (
	"context"
	"errors"
	"os"

	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/config"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

func main() {
	applicationConfig, err := config.Load()
	if err != nil {
		panic(err)
	}

	logger, err := config.NewLogger(applicationConfig.LogLevel)
	if err != nil {
		panic(err)
	}

	database, err := config.OpenDatabase(context.Background(), applicationConfig.DatabaseURL, logger)
	if err != nil {
		panic(err)
	}

	sqlDatabase, err := database.DB()
	if err != nil {
		panic(err)
	}
	defer sqlDatabase.Close()

	repository := repository.NewAdministratorRepository(database, logger)
	seedUsecase := usecase.NewSeedAdministratorUsecase(repository)
	if err := seedUsecase.Seed(context.Background(), usecase.SeedAdministratorInput{
		Username: os.Getenv("ADMIN_USERNAME"),
		Email:    os.Getenv("ADMIN_EMAIL"),
		Password: os.Getenv("ADMIN_PASSWORD"),
	}); err != nil {
		if !handleSeedError(err, logger) {
			panic(err)
		}
		return
	}

	logger.Info("administrator created")
}

func handleSeedError(err error, logger *logrus.Logger) bool {
	if errors.Is(err, repository.ErrAdministratorExists) {
		logger.Info("administrator already exists")
		return true
	}

	return false
}
