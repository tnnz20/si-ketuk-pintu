package integration

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/config"
	"gorm.io/gorm"
)

var (
	appDB     *gorm.DB
	bootstrap *config.Bootstrap
)

func TestMain(m *testing.M) {
	// Attempt to load .env from the backend root if it exists
	_ = godotenv.Load("../../.env")

	// Set required environment variables for test if not present
	if os.Getenv("APP_ENV") == "" {
		os.Setenv("APP_ENV", "test")
	}
	if os.Getenv("DATABASE_URL") == "" && os.Getenv("TEST_DATABASE_URL") != "" {
		// Use test DB for standard DATABASE_URL to avoid touching dev DB
		os.Setenv("DATABASE_URL", os.Getenv("TEST_DATABASE_URL"))
	}
	if os.Getenv("JWT_SECRET") == "" {
		os.Setenv("JWT_SECRET", "test-secret-key-for-integration")
	}
	if os.Getenv("UPLOAD_DIR") == "" {
		os.Setenv("UPLOAD_DIR", os.TempDir())
	}
	if os.Getenv("APP_TIME_ZONE") == "" {
		os.Setenv("APP_TIME_ZONE", "Asia/Makassar")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		// Skip tests if no database URL is provided
		os.Exit(0)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var err error
	bootstrap, err = config.NewBootstrap(ctx)
	if err != nil {
		panic(err)
	}
	defer bootstrap.Close()

	// Disable info logs for cleaner test output, keep errors
	bootstrap.Logger.SetOutput(os.Stdout)
	bootstrap.Logger.SetLevel(logrus.ErrorLevel)

	appDB = bootstrap.DB

	os.Exit(m.Run())
}

func clearDatabase(t *testing.T) {
	t.Helper()

	tables := []string{
		"audit_events",
		"attachments",
		"guests",
		"visit_requests",
		"administrators",
	}

	for _, table := range tables {
		err := appDB.Exec("TRUNCATE TABLE " + table + " CASCADE").Error
		if err != nil {
			t.Fatalf("truncate %s: %v", table, err)
		}
	}
}
