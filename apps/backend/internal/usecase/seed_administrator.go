package usecase

import (
	"context"
	"fmt"
	"strings"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"golang.org/x/crypto/bcrypt"
)

type AdministratorCreator interface {
	Create(ctx context.Context, administrator *entity.Administrator) error
}

type SeedAdministratorInput struct {
	Username string
	Email    string
	Password string
}

type SeedAdministratorUsecase struct {
	repository AdministratorCreator
}

func NewSeedAdministratorUsecase(repository AdministratorCreator) *SeedAdministratorUsecase {
	return &SeedAdministratorUsecase{repository: repository}
}

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
