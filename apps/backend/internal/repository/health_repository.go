package repository

import (
	"context"
	"fmt"

	"gorm.io/gorm"
)

type DatabaseHealthRepository struct {
	database *gorm.DB
}

func NewDatabaseHealthRepository(database *gorm.DB) *DatabaseHealthRepository {
	return &DatabaseHealthRepository{database: database}
}

func (r *DatabaseHealthRepository) IsReady(ctx context.Context) error {
	sqlDatabase, err := r.database.DB()
	if err != nil {
		return fmt.Errorf("access sql database: %w", err)
	}

	if err := sqlDatabase.PingContext(ctx); err != nil {
		return fmt.Errorf("ping database: %w", err)
	}

	return nil
}
