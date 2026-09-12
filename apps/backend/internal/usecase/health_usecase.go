package usecase

import "context"

// HealthRepository reports whether backing services are ready.
type HealthRepository interface {
	IsReady(ctx context.Context) error
}

// HealthUsecase exposes readiness checks for the health endpoints.
type HealthUsecase struct {
	repository HealthRepository
}

// NewHealthUsecase creates a HealthUsecase backed by the given repository.
func NewHealthUsecase(repository HealthRepository) *HealthUsecase {
	return &HealthUsecase{repository: repository}
}

// IsReady reports whether the database is reachable.
func (u *HealthUsecase) IsReady(ctx context.Context) error {
	return u.repository.IsReady(ctx)
}
