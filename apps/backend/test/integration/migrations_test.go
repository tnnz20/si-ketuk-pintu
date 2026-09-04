package integration

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func newMigrator(t *testing.T, databaseURL string) *migrate.Migrate {
	t.Helper()

	migrationDirectory, err := filepath.Abs("../../db/migrations")
	if err != nil {
		t.Fatalf("resolve migration directory: %v", err)
	}

	migrator, err := migrate.New("file://"+filepath.ToSlash(migrationDirectory), databaseURL)
	if err != nil {
		t.Fatalf("create migrator: %v", err)
	}
	t.Cleanup(func() { migrator.Close() })
	return migrator
}

type columnExpectation struct {
	table      string
	name       string
	dataType   string
	hasDefault bool
}

var epochColumnExpectations = []columnExpectation{
	{table: "administrators", name: "created_at", dataType: "bigint", hasDefault: true},
	{table: "administrators", name: "updated_at", dataType: "bigint", hasDefault: true},
	{table: "visit_requests", name: "tanggal_kunjungan", dataType: "bigint", hasDefault: false},
	{table: "visit_requests", name: "jam_kunjungan", dataType: "bigint", hasDefault: false},
	{table: "visit_requests", name: "created_at", dataType: "bigint", hasDefault: true},
	{table: "visit_requests", name: "updated_at", dataType: "bigint", hasDefault: true},
	{table: "attachments", name: "created_at", dataType: "bigint", hasDefault: true},
	{table: "audit_events", name: "occurred_at", dataType: "bigint", hasDefault: true},
}

var rolledBackColumnExpectations = []columnExpectation{
	{table: "administrators", name: "created_at", dataType: "timestamp with time zone", hasDefault: true},
	{table: "administrators", name: "updated_at", dataType: "timestamp with time zone", hasDefault: true},
	{table: "visit_requests", name: "tanggal_kunjungan", dataType: "date", hasDefault: false},
	{table: "visit_requests", name: "jam_kunjungan", dataType: "time without time zone", hasDefault: false},
	{table: "visit_requests", name: "created_at", dataType: "timestamp with time zone", hasDefault: true},
	{table: "visit_requests", name: "updated_at", dataType: "timestamp with time zone", hasDefault: true},
	{table: "attachments", name: "created_at", dataType: "timestamp with time zone", hasDefault: true},
	{table: "audit_events", name: "occurred_at", dataType: "timestamp with time zone", hasDefault: true},
}

func assertColumns(t *testing.T, database *sql.DB, expectations []columnExpectation) {
	t.Helper()

	for _, column := range expectations {
		var dataType, isNullable string
		var columnDefault sql.NullString
		if err := database.QueryRow(
			`SELECT data_type, is_nullable, column_default
			 FROM information_schema.columns
			 WHERE table_name = $1 AND column_name = $2`,
			column.table, column.name,
		).Scan(&dataType, &isNullable, &columnDefault); err != nil {
			t.Fatalf("inspect %s.%s: %v", column.table, column.name, err)
		}
		if dataType != column.dataType {
			t.Errorf("%s.%s data_type = %q, want %q", column.table, column.name, dataType, column.dataType)
		}
		if isNullable != "NO" {
			t.Errorf("%s.%s is_nullable = %q, want NO", column.table, column.name, isNullable)
		}
		if column.hasDefault && !columnDefault.Valid {
			t.Errorf("%s.%s has no default, want one", column.table, column.name)
		}
		if !column.hasDefault && columnDefault.Valid {
			t.Errorf("%s.%s default = %q, want none", column.table, column.name, columnDefault.String)
		}
	}
}

func assertTemporalIndexes(t *testing.T, database *sql.DB) {
	t.Helper()

	for _, index := range []string{
		"visit_requests_status_visit_date_index",
		"visit_requests_visit_date_index",
		"audit_events_visit_request_occurred_at_index",
		"audit_events_administrator_occurred_at_index",
	} {
		var exists bool
		if err := database.QueryRow(
			"SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = $1)",
			index,
		).Scan(&exists); err != nil {
			t.Fatalf("check index %q: %v", index, err)
		}
		if !exists {
			t.Errorf("index %q does not exist", index)
		}
	}
}

func TestEpochMigrationRoundTrip(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL is not configured")
	}

	migrator := newMigrator(t, databaseURL)

	if err := migrator.Migrate(5); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		t.Fatalf("apply migrations up to 5: %v", err)
	}

	database, err := sql.Open("pgx", databaseURL)
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	defer database.Close()

	if _, err := database.Exec("TRUNCATE TABLE administrators, visit_requests, attachments, audit_events CASCADE"); err != nil {
		t.Fatalf("clear tables: %v", err)
	}

	instant := time.Date(2026, 1, 5, 10, 30, 0, 0, witaZone)
	wantInstantMillis := instant.UnixMilli()
	wantDateMillis := time.Date(2026, 1, 5, 0, 0, 0, 0, witaZone).UnixMilli()
	wantTimeMillis := time.Date(1970, 1, 1, 10, 30, 0, 0, witaZone).UnixMilli()

	if _, err := database.Exec(
		`INSERT INTO administrators (username, email, password_hash, created_at, updated_at)
		 VALUES ('epoch-test', 'epoch-test@example.com', '$2a$10$abcdefghijklmnopqrstuv', $1, $1)`,
		instant,
	); err != nil {
		t.Fatalf("seed administrator: %v", err)
	}

	if _, err := database.Exec(
		`INSERT INTO visit_requests (token, email, nama_instansi, alamat_instansi, tanggal_kunjungan, jam_kunjungan, tema_kunjungan, pimpinan_rombongan, jumlah_tamu, kontak_dihubungi, created_at, updated_at)
		 VALUES ('SKP-20260105-EPOCH', 'epoch-test@example.com', 'PT Epoch', 'Jl. Epoch 1', '2026-01-05', '10:30', 'Studi Banding', 'Budi', 1, '08123456789', $1, $1)`,
		instant,
	); err != nil {
		t.Fatalf("seed visit request: %v", err)
	}

	if _, err := database.Exec(
		`INSERT INTO attachments (visit_request_id, attachment_type, original_name, storage_key, content_type, size_bytes, checksum_sha256, created_at)
		 SELECT id, 'surat_kunjungan', 'surat.pdf', 'epoch/surat.pdf', 'application/pdf', 1, repeat('a', 64), $1
		 FROM visit_requests WHERE token = 'SKP-20260105-EPOCH'`,
		instant,
	); err != nil {
		t.Fatalf("seed attachment: %v", err)
	}

	if _, err := database.Exec(
		`INSERT INTO audit_events (visit_request_id, actor_type, action, occurred_at)
		 SELECT id, 'visitor', 'request_submitted', $1
		 FROM visit_requests WHERE token = 'SKP-20260105-EPOCH'`,
		instant,
	); err != nil {
		t.Fatalf("seed audit event: %v", err)
	}

	if err := migrator.Migrate(6); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		t.Fatalf("apply epoch migration: %v", err)
	}

	assertColumns(t, database, epochColumnExpectations)
	assertTemporalIndexes(t, database)

	for _, column := range []struct {
		table, name string
		want        int64
	}{
		{"administrators", "created_at", wantInstantMillis},
		{"administrators", "updated_at", wantInstantMillis},
		{"visit_requests", "tanggal_kunjungan", wantDateMillis},
		{"visit_requests", "jam_kunjungan", wantTimeMillis},
		{"visit_requests", "created_at", wantInstantMillis},
		{"visit_requests", "updated_at", wantInstantMillis},
		{"attachments", "created_at", wantInstantMillis},
		{"audit_events", "occurred_at", wantInstantMillis},
	} {
		var got int64
		if err := database.QueryRow(
			"SELECT "+column.name+" FROM "+column.table+" WHERE "+column.name+" IS NOT NULL ORDER BY 1 LIMIT 1",
		).Scan(&got); err != nil {
			t.Fatalf("read %s.%s: %v", column.table, column.name, err)
		}
		if got != column.want {
			t.Errorf("%s.%s = %d, want %d", column.table, column.name, got, column.want)
		}
	}

	if err := migrator.Migrate(5); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		t.Fatalf("rollback epoch migration: %v", err)
	}

	assertColumns(t, database, rolledBackColumnExpectations)
	assertTemporalIndexes(t, database)

	var tanggal, jam string
	if err := database.QueryRow(
		"SELECT tanggal_kunjungan::text, jam_kunjungan::text FROM visit_requests WHERE token = 'SKP-20260105-EPOCH'",
	).Scan(&tanggal, &jam); err != nil {
		t.Fatalf("read round-tripped visit schedule: %v", err)
	}
	if tanggal != "2026-01-05" || jam != "10:30:00" {
		t.Errorf("round-trip schedule = %q %q, want 2026-01-05 10:30:00", tanggal, jam)
	}

	for _, column := range []struct {
		table, name, where string
	}{
		{"administrators", "created_at", "username = 'epoch-test'"},
		{"administrators", "updated_at", "username = 'epoch-test'"},
		{"visit_requests", "created_at", "token = 'SKP-20260105-EPOCH'"},
		{"visit_requests", "updated_at", "token = 'SKP-20260105-EPOCH'"},
		{"attachments", "created_at", "storage_key = 'epoch/surat.pdf'"},
		{"audit_events", "occurred_at", "action = 'request_submitted'"},
	} {
		var got time.Time
		if err := database.QueryRow(
			"SELECT "+column.name+" FROM "+column.table+" WHERE "+column.where,
		).Scan(&got); err != nil {
			t.Fatalf("read %s.%s: %v", column.table, column.name, err)
		}
		if !got.Equal(instant) {
			t.Errorf("round-trip %s.%s = %v, want %v", column.table, column.name, got, instant)
		}
	}

	if err := migrator.Up(); err != nil {
		t.Fatalf("re-apply migrations: %v", err)
	}
}

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

	if err := migrator.Up(); err != nil {
		t.Fatalf("re-apply migrations: %v", err)
	}
}

func assertAdministratorSeedIsCreateOnly(t *testing.T, databaseURL string) {
	t.Helper()

	database, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		t.Fatalf("open gorm database: %v", err)
	}

	seedUsecase := usecase.NewSeedAdministratorUsecase(
		repository.NewAdministratorRepository(database, logrus.New()),
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
