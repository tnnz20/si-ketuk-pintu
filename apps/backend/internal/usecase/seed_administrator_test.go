package usecase

import (
	"context"
	"testing"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"golang.org/x/crypto/bcrypt"
)

type administratorCreatorStub struct {
	administrator *entity.Administrator
}

func (s *administratorCreatorStub) Create(_ context.Context, administrator *entity.Administrator) error {
	s.administrator = administrator
	return nil
}

func TestSeedHashesPassword(t *testing.T) {
	t.Parallel()

	repository := &administratorCreatorStub{}
	usecase := NewSeedAdministratorUsecase(repository)
	err := usecase.Seed(context.Background(), SeedAdministratorInput{
		Username: "admin",
		Email:    "admin@example.com",
		Password: "safe-password",
	})
	if err != nil {
		t.Fatalf("seed administrator: %v", err)
	}

	if repository.administrator == nil {
		t.Fatal("administrator was not created")
	}

	if err := bcrypt.CompareHashAndPassword(
		[]byte(repository.administrator.PasswordHash),
		[]byte("safe-password"),
	); err != nil {
		t.Fatalf("password hash does not match password: %v", err)
	}
}

func TestSeedRequiresAllInputs(t *testing.T) {
	t.Parallel()

	usecase := NewSeedAdministratorUsecase(&administratorCreatorStub{})
	err := usecase.Seed(context.Background(), SeedAdministratorInput{
		Username: "admin",
		Email:    "admin@example.com",
	})
	if err == nil {
		t.Fatal("seed administrator should reject a missing password")
	}
}
