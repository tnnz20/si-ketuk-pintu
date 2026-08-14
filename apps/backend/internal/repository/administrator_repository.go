package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"gorm.io/gorm"
)

var ErrAdministratorExists = errors.New("administrator already exists")

type AdministratorRepository struct {
	database *gorm.DB
	logger   *logrus.Logger
}

func NewAdministratorRepository(database *gorm.DB, logger *logrus.Logger) *AdministratorRepository {
	return &AdministratorRepository{database: database, logger: logger}
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
		r.logger.WithError(err).Error("failed to find existing administrator")
		return fmt.Errorf("find existing administrator: %w", err)
	}

	if err := r.database.WithContext(ctx).Create(administrator).Error; err != nil {
		r.logger.WithError(err).Error("failed to create administrator")
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

		r.logger.WithError(err).Error("failed to find administrator by identifier")
		return nil, fmt.Errorf("find administrator by identifier: %w", err)
	}

	return &administrator, nil
}
