package config

import "testing"

func TestLoadRejectsMissingDatabaseURL(t *testing.T) {
	t.Parallel()

	_, err := load(func(string) string { return "" })
	if err == nil {
		t.Fatal("load config should reject a missing DATABASE_URL")
	}
}

func TestLoadRejectsInvalidPort(t *testing.T) {
	t.Parallel()

	_, err := load(func(key string) string {
		switch key {
		case "DATABASE_URL":
			return "postgres://skp:password@localhost:5432/si_ketuk_pintu?sslmode=disable"
		case "JWT_SECRET":
			return "test-secret"
		case "APP_PORT":
			return "invalid"
		default:
			return ""
		}
	})
	if err == nil {
		t.Fatal("load config should reject an invalid APP_PORT")
	}
}

func TestLoadRejectsMissingJWTSecret(t *testing.T) {
	t.Parallel()

	_, err := load(func(key string) string {
		if key == "DATABASE_URL" {
			return "postgres://skp:password@localhost:5432/si_ketuk_pintu?sslmode=disable"
		}

		return ""
	})
	if err == nil {
		t.Fatal("load config should reject a missing JWT_SECRET")
	}
}

