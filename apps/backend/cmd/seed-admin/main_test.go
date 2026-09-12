package main

import (
	"errors"
	"testing"

	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/ssh"
)

func TestParseSSHFlagAcceptsStandaloneFlag(t *testing.T) {
	t.Parallel()

	sshEnabled, remainingArgs, err := ssh.ParseSSHFlag([]string{"--ssh"})
	if err != nil || !sshEnabled || len(remainingArgs) != 0 {
		t.Fatalf("ParseSSHFlag(--ssh) = %v, %v, %v", sshEnabled, remainingArgs, err)
	}
}

func TestParseSSHFlagRejectsUnknownFlag(t *testing.T) {
	t.Parallel()

	if _, _, err := ssh.ParseSSHFlag([]string{"--other"}); err == nil {
		t.Fatal("unknown flags should be rejected")
	}
}

func TestHandleSeedErrorAcceptsExistingAdministrator(t *testing.T) {
	logger := logrus.New()

	if !handleSeedError(repository.ErrAdministratorExists, logger) {
		t.Fatal("existing administrator should be accepted")
	}
}

func TestHandleSeedErrorRejectsUnexpectedError(t *testing.T) {
	logger := logrus.New()

	if handleSeedError(errors.New("database unavailable"), logger) {
		t.Fatal("unexpected error should not be accepted")
	}
}
