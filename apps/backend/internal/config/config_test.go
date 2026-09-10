package config

import "testing"

func TestLoadRejectsMissingDatabaseConfig(t *testing.T) {
	t.Parallel()

	_, err := load(func(string) string { return "" })
	if err == nil {
		t.Fatal("load config should reject missing database config")
	}
}

func TestLoadRejectsInvalidPort(t *testing.T) {
	t.Parallel()

	_, err := load(func(key string) string {
		switch key {
		case "POSTGRES_USER":
			return "skp"
		case "POSTGRES_DB":
			return "si_ketuk_pintu"
		case "POSTGRES_PORT":
			return "5432"
		case "APP_PORT":
			return "invalid"
		case "JWT_SECRET":
			return "test-secret"
		default:
			return ""
		}
	})
	if err == nil {
		t.Fatal("load config should reject an invalid APP_PORT")
	}
}

func TestLoadBuildsDatabaseDSN(t *testing.T) {
	t.Parallel()

	config, err := load(func(key string) string {
		values := map[string]string{
			"POSTGRES_HOST":     "localhost",
			"POSTGRES_PORT":     "5432",
			"POSTGRES_USER":     "skp",
			"POSTGRES_PASSWORD": "password",
			"POSTGRES_DB":       "si_ketuk_pintu",
			"POSTGRES_SSLMODE":  "disable",
			"JWT_SECRET":        "test-secret",
		}
		return values[key]
	})
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if config.Database.GetDSN() != "host=localhost port=5432 user=skp password=password dbname=si_ketuk_pintu sslmode=disable" {
		t.Fatalf("unexpected DSN: %s", config.Database.GetDSN())
	}
}

func TestLoadRejectsMissingJWTSecret(t *testing.T) {
	t.Parallel()

	_, err := load(func(key string) string {
		if key == "POSTGRES_USER" {
			return "skp"
		}
		if key == "POSTGRES_DB" {
			return "si_ketuk_pintu"
		}
		return ""
	})
	if err == nil {
		t.Fatal("load config should reject a missing JWT_SECRET")
	}
}
