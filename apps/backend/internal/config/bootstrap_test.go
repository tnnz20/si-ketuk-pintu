package config

import (
	"bytes"
	"encoding/json"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestGinModeFor(t *testing.T) {
	t.Parallel()

	if mode := ginModeFor("production"); mode != gin.ReleaseMode {
		t.Fatalf("expected release mode in production, got %q", mode)
	}

	if mode := ginModeFor("development"); mode != "" {
		t.Fatalf("expected no mode override outside production, got %q", mode)
	}

	if mode := ginModeFor(""); mode != "" {
		t.Fatalf("expected no mode override for empty environment, got %q", mode)
	}
}

func TestEnvironmentLogFields(t *testing.T) {
	previousMode := gin.Mode()
	t.Cleanup(func() { gin.SetMode(previousMode) })

	logger, err := NewLogger("info")
	if err != nil {
		t.Fatalf("new logger: %v", err)
	}
	var buffer bytes.Buffer
	logger.SetOutput(&buffer)

	environment := "production"
	if mode := ginModeFor(environment); mode != "" {
		gin.SetMode(mode)
	}
	logger.WithFields(map[string]any{
		"environment": environment,
		"gin_mode":    gin.Mode(),
	}).Info("application environment loaded")

	var entry map[string]any
	if err := json.Unmarshal(buffer.Bytes(), &entry); err != nil {
		t.Fatalf("parse log entry: %v", err)
	}
	if entry["environment"] != "production" {
		t.Fatalf("expected environment production, got %v", entry["environment"])
	}
	if entry["gin_mode"] != gin.ReleaseMode {
		t.Fatalf("expected gin_mode %q, got %v", gin.ReleaseMode, entry["gin_mode"])
	}
	if entry["msg"] != "application environment loaded" {
		t.Fatalf("unexpected message: %v", entry["msg"])
	}
}
