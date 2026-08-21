package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/config"
)

func main() {
	if len(os.Args) < 2 || len(os.Args) > 3 {
		panic("usage: migrate [up|down|version|force VERSION]")
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

	command := os.Args[1]
	if command == "force" && len(os.Args) != 3 {
		panic("usage: migrate force VERSION")
	}

	if err := execute(migrator, command, os.Args[2:]); err != nil {
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

func execute(migrator *migrate.Migrate, command string, args []string) error {
	switch command {
	case "up":
		return ignoreNoChange(migrator.Up())
	case "down":
		return ignoreNoChange(migrator.Steps(-1))
	case "force":
		version, err := strconv.Atoi(args[0])
		if err != nil || version < 0 {
			return fmt.Errorf("invalid migration version %q", args[0])
		}
		return migrator.Force(version)
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
