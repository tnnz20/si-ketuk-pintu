package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"gorm.io/gorm"
)

var ErrAdministratorExists = errors.New("administrator already exists")

type AdministratorRepository struct {
	database *gorm.DB
}

func NewAdministratorRepository(database *gorm.DB) *AdministratorRepository {
	return &AdministratorRepository{database: database}
}

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

var ErrAdministratorNotFound = errors.New("administrator not found")

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
