package main

import (
	"context"
	"errors"
	"os"

	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/config"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/ssh"
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

	sshEnabled, _, err := ssh.ParseSSHFlag(os.Args[1:])
	if err != nil {
		panic(err)
	}

	seed := func(databaseURL string) error {
		return runSeed(context.Background(), databaseURL, logger)
	}

	if sshEnabled {
		if err := ssh.RunWithTunnel(context.Background(), applicationConfig.SSH, seed); err != nil {
			panic(err)
		}
		return
	}

	if err := seed(applicationConfig.DatabaseURL); err != nil {
		panic(err)
	}
}

func runSeed(ctx context.Context, databaseURL string, logger *logrus.Logger) error {
	database, err := config.OpenDatabase(ctx, databaseURL, logger)
	if err != nil {
		return err
	}

	sqlDatabase, err := database.DB()
	if err != nil {
		return err
	}
	defer sqlDatabase.Close()

	repository := repository.NewAdministratorRepository(database)
	seedUsecase := usecase.NewSeedAdministratorUsecase(repository)
	if err := seedUsecase.Seed(ctx, usecase.SeedAdministratorInput{
		Username: os.Getenv("ADMIN_USERNAME"),
		Email:    os.Getenv("ADMIN_EMAIL"),
		Password: os.Getenv("ADMIN_PASSWORD"),
	}); err != nil {
		if !handleSeedError(err, logger) {
			return err
		}
		return nil
	}

	logger.Info("administrator created")
	return nil
}

func handleSeedError(err error, logger *logrus.Logger) bool {
	if errors.Is(err, repository.ErrAdministratorExists) {
		logger.Info("administrator already exists")
		return true
	}

	return false
}
