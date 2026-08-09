package integration

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"path/filepath"
	"testing"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestInitialSchemaMigrationRoundTrip(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL is not configured")
	}

	migrationDirectory, err := filepath.Abs("../../db/migrations")
	if err != nil {
		t.Fatalf("resolve migration directory: %v", err)
	}

	migrator, err := migrate.New("file://"+filepath.ToSlash(migrationDirectory), databaseURL)
	if err != nil {
		t.Fatalf("create migrator: %v", err)
	}
	defer migrator.Close()

	if err := migrator.Down(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		t.Fatalf("reset migrations: %v", err)
	}

	if err := migrator.Up(); err != nil {
		t.Fatalf("apply migrations: %v", err)
	}

	database, err := sql.Open("pgx", databaseURL)
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	defer database.Close()

	for _, table := range []string{
		"administrators",
		"visit_requests",
		"guests",
		"attachments",
		"audit_events",
	} {
		var relation sql.NullString
		if err := database.QueryRow("SELECT to_regclass($1)", table).Scan(&relation); err != nil {
			t.Fatalf("check table %q: %v", table, err)
		}
		if !relation.Valid {
			t.Fatalf("table %q does not exist", table)
		}
	}

	assertAdministratorSeedIsCreateOnly(t, databaseURL)

	if err := migrator.Down(); err != nil {
		t.Fatalf("rollback migration: %v", err)
	}
}

func assertAdministratorSeedIsCreateOnly(t *testing.T, databaseURL string) {
	t.Helper()

	database, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		t.Fatalf("open gorm database: %v", err)
	}

	seedUsecase := usecase.NewSeedAdministratorUsecase(
		repository.NewAdministratorRepository(database),
	)
	input := usecase.SeedAdministratorInput{
		Username: "migration-test-admin",
		Email:    "migration-test-admin@example.com",
		Password: "migration-test-password",
	}
	if err := seedUsecase.Seed(context.Background(), input); err != nil {
		t.Fatalf("seed administrator: %v", err)
	}

	var passwordHash string
	if err := database.Raw(
		"SELECT password_hash FROM administrators WHERE username = ?",
		input.Username,
	).Scan(&passwordHash).Error; err != nil {
		t.Fatalf("read administrator password hash: %v", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(input.Password)); err != nil {
		t.Fatalf("verify administrator password hash: %v", err)
	}

	err = seedUsecase.Seed(context.Background(), input)
	if !errors.Is(err, repository.ErrAdministratorExists) {
		t.Fatalf("duplicate seed error = %v, want ErrAdministratorExists", err)
	}
}
