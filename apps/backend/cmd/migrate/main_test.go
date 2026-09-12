package main

import (
	"strings"
	"testing"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/config"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/ssh"
)

func TestParseSSHFlagAcceptsFlagBeforeCommand(t *testing.T) {
	t.Parallel()

	sshEnabled, remainingArgs, err := ssh.ParseSSHFlag([]string{"--ssh", "up"})
	if err != nil {
		t.Fatalf("parse --ssh up: %v", err)
	}
	if !sshEnabled {
		t.Fatal("--ssh should be detected")
	}
	if len(remainingArgs) != 1 || remainingArgs[0] != "up" {
		t.Fatalf("remaining args = %v, want [up]", remainingArgs)
	}
}

func TestParseSSHFlagRejectsUnknownFlag(t *testing.T) {
	t.Parallel()

	if _, _, err := ssh.ParseSSHFlag([]string{"--verbose", "up"}); err == nil {
		t.Fatal("unknown flags should be rejected")
	}
}

func TestValidateSSHTunnelConfigRejectsMissingSSHSettings(t *testing.T) {
	t.Parallel()

	err := config.ValidateSSHTunnelConfig(ssh.TunnelConfig{})
	if err == nil {
		t.Fatal("empty SSH settings should be rejected")
	}
	if !strings.Contains(err.Error(), "SSH_HOST") {
		t.Fatalf("error %q should name the first missing variable", err.Error())
	}
}
