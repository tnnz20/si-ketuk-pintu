package usecase

import (
	"context"
	"fmt"
	"strings"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"golang.org/x/crypto/bcrypt"
)

// AdministratorCreator persists new administrator accounts.
type AdministratorCreator interface {
	Create(ctx context.Context, administrator *entity.Administrator) error
}

// SeedAdministratorInput holds the credentials for a new administrator.
type SeedAdministratorInput struct {
	Username string
	Email    string
	Password string
}

// SeedAdministratorUsecase creates the initial administrator account.
type SeedAdministratorUsecase struct {
	repository AdministratorCreator
}

// NewSeedAdministratorUsecase creates a SeedAdministratorUsecase backed by
// the given repository.
func NewSeedAdministratorUsecase(repository AdministratorCreator) *SeedAdministratorUsecase {
	return &SeedAdministratorUsecase{repository: repository}
}

// Seed validates the input, hashes the password, and creates the
// administrator account with IsActive set.
func (u *SeedAdministratorUsecase) Seed(ctx context.Context, input SeedAdministratorInput) error {
	username := strings.TrimSpace(input.Username)
	email := strings.TrimSpace(input.Email)
	password := strings.TrimSpace(input.Password)
	if username == "" || email == "" || password == "" {
		return fmt.Errorf("ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required")
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash administrator password: %w", err)
	}

	administrator := &entity.Administrator{
		Username:     username,
		Email:        email,
		PasswordHash: string(passwordHash),
		IsActive:     true,
	}

	return u.repository.Create(ctx, administrator)
}
