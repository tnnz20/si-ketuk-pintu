package persistence

import (
	"context"
	"fmt"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
	"gorm.io/gorm"
)

type healthRepository struct {
	database *gorm.DB
}

// NewHealthRepository creates a HealthRepository backed by GORM.
func NewHealthRepository(database *gorm.DB) repository.HealthRepository {
	return &healthRepository{database: database}
}

// IsReady pings the database, returning an error if it is unreachable.
func (r *healthRepository) IsReady(ctx context.Context) error {
	sqlDatabase, err := r.database.DB()
	if err != nil {
		return fmt.Errorf("access sql database: %w", err)
	}

	if err := sqlDatabase.PingContext(ctx); err != nil {
		return fmt.Errorf("ping database: %w", err)
	}

	return nil
}
