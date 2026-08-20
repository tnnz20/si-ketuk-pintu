package main

import (
	"errors"
	"testing"

	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
)

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
