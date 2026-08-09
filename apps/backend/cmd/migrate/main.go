package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/config"
)

func main() {
	if len(os.Args) != 2 {
		panic("usage: migrate [up|down|version]")
	}

	applicationConfig, err := config.Load()
	if err != nil {
		panic(err)
	}

	sourceURL, err := migrationSourceURL()
	if err != nil {
		panic(err)
	}

	migrator, err := migrate.New(sourceURL, applicationConfig.DatabaseURL)
	if err != nil {
		panic(err)
	}
	defer migrator.Close()

	if err := execute(migrator, os.Args[1]); err != nil {
		panic(err)
	}
}

func migrationSourceURL() (string, error) {
	migrationDirectory, err := filepath.Abs("db/migrations")
	if err != nil {
		return "", fmt.Errorf("resolve migration directory: %w", err)
	}

	return "file://" + filepath.ToSlash(migrationDirectory), nil
}

func execute(migrator *migrate.Migrate, command string) error {
	switch command {
	case "up":
		return ignoreNoChange(migrator.Up())
	case "down":
		return ignoreNoChange(migrator.Steps(-1))
	case "version":
		version, dirty, err := migrator.Version()
		if errors.Is(err, migrate.ErrNilVersion) {
			fmt.Println("no migrations applied")
			return nil
		}
		if err != nil {
			return err
		}

		fmt.Printf("version=%d dirty=%t\n", version, dirty)
		return nil
	default:
		return fmt.Errorf("unsupported migration command %q", command)
	}
}

func ignoreNoChange(err error) error {
	if errors.Is(err, migrate.ErrNoChange) {
		return nil
	}

	return err
}
