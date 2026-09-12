package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/config"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/ssh"
)

func main() {
	if len(os.Args) < 2 {
		panic("usage: migrate [--ssh] [up|down|version|force VERSION]")
	}

	sshEnabled, remainingArgs, err := ssh.ParseSSHFlag(os.Args[1:])
	if err != nil {
		panic(err)
	}
	if len(remainingArgs) < 1 || len(remainingArgs) > 2 {
		panic("usage: migrate [--ssh] [up|down|version|force VERSION]")
	}

	applicationConfig, err := config.Load()
	if err != nil {
		panic(err)
	}

	sourceURL, err := migrationSourceURL()
	if err != nil {
		panic(err)
	}

	command := remainingArgs[0]
	if command == "force" && len(remainingArgs) != 2 {
		panic("usage: migrate force VERSION")
	}

	run := func(databaseURL string) error {
		migrator, err := migrate.New(sourceURL, databaseURL)
		if err != nil {
			return err
		}
		defer migrator.Close()

		return execute(migrator, command, remainingArgs[1:])
	}

	if sshEnabled {
		if err := ssh.RunWithTunnel(context.Background(), applicationConfig.SSH, run); err != nil {
			panic(err)
		}
		return
	}

	if err := run(applicationConfig.DatabaseURL); err != nil {
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
