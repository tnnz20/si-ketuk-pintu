package repository

import (
	"context"
	"errors"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
)

var (
	// ErrAdministratorExists is returned when creating an administrator whose
	// username or email is already taken.
	ErrAdministratorExists = errors.New("administrator already exists")

	// ErrAdministratorNotFound is returned when no administrator matches the
	// given identifier.
	ErrAdministratorNotFound = errors.New("administrator not found")
)

// AdministratorRepository defines persistence operations for administrator accounts.
type AdministratorRepository interface {
	Create(ctx context.Context, administrator *entity.Administrator) error
	FindByIdentifier(ctx context.Context, identifier string) (*entity.Administrator, error)
}
