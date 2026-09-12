package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"gorm.io/gorm"
)

// ErrAdministratorExists is returned when creating an administrator whose
// username or email is already taken.
var ErrAdministratorExists = errors.New("administrator already exists")

// AdministratorRepository stores and retrieves administrator accounts using
// GORM.
type AdministratorRepository struct {
	database *gorm.DB
}

// NewAdministratorRepository creates an AdministratorRepository backed by
// the given database handle.
func NewAdministratorRepository(database *gorm.DB) *AdministratorRepository {
	return &AdministratorRepository{database: database}
}

// Create persists a new administrator, returning ErrAdministratorExists if
// an account with the same username or email already exists.
func (r *AdministratorRepository) Create(ctx context.Context, administrator *entity.Administrator) error {
	var existing entity.Administrator
	err := r.database.WithContext(ctx).
		Where("LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)", administrator.Username, administrator.Email).
		First(&existing).Error
	if err == nil {
		return ErrAdministratorExists
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("find existing administrator: %w", err)
	}

	if err := r.database.WithContext(ctx).Create(administrator).Error; err != nil {
		return fmt.Errorf("create administrator: %w", err)
	}

	return nil
}

// ErrAdministratorNotFound is returned when no administrator matches the
// given identifier.
var ErrAdministratorNotFound = errors.New("administrator not found")

// FindByIdentifier looks up an active-or-inactive administrator by username
// or email (case-insensitive), returning ErrAdministratorNotFound if absent.
func (r *AdministratorRepository) FindByIdentifier(ctx context.Context, identifier string) (*entity.Administrator, error) {
	var administrator entity.Administrator
	err := r.database.WithContext(ctx).
		Where("LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)", identifier, identifier).
		First(&administrator).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdministratorNotFound
		}

		return nil, fmt.Errorf("find administrator by identifier: %w", err)
	}

	return &administrator, nil
}
