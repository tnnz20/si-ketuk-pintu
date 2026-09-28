package persistence

import (
	"context"
	"errors"
	"fmt"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
	"gorm.io/gorm"
)

type administratorRepository struct {
	database *gorm.DB
}

// NewAdministratorRepository creates an AdministratorRepository backed by GORM.
func NewAdministratorRepository(database *gorm.DB) repository.AdministratorRepository {
	return &administratorRepository{database: database}
}

// Create persists a new administrator, returning ErrAdministratorExists if
// an account with the same username or email already exists.
func (r *administratorRepository) Create(ctx context.Context, administrator *entity.Administrator) error {
	var existing entity.Administrator
	err := r.database.WithContext(ctx).
		Where("LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)", administrator.Username, administrator.Email).
		First(&existing).Error
	if err == nil {
		return repository.ErrAdministratorExists
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("find existing administrator: %w", err)
	}

	if err := r.database.WithContext(ctx).Create(administrator).Error; err != nil {
		return fmt.Errorf("create administrator: %w", err)
	}

	return nil
}

// FindByIdentifier looks up an active-or-inactive administrator by username
// or email (case-insensitive), returning ErrAdministratorNotFound if absent.
func (r *administratorRepository) FindByIdentifier(ctx context.Context, identifier string) (*entity.Administrator, error) {
	var administrator entity.Administrator
	err := r.database.WithContext(ctx).
		Where("LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)", identifier, identifier).
		First(&administrator).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, repository.ErrAdministratorNotFound
		}

		return nil, fmt.Errorf("find administrator by identifier: %w", err)
	}

	return &administrator, nil
}
