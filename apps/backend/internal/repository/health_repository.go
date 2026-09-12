package repository

import (
	"context"
	"fmt"

	"gorm.io/gorm"
)

// DatabaseHealthRepository checks database connectivity for readiness
// probes.
type DatabaseHealthRepository struct {
	database *gorm.DB
}

// NewDatabaseHealthRepository creates a DatabaseHealthRepository backed by
// the given database handle.
func NewDatabaseHealthRepository(database *gorm.DB) *DatabaseHealthRepository {
	return &DatabaseHealthRepository{database: database}
}

// IsReady pings the database, returning an error if it is unreachable.
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
