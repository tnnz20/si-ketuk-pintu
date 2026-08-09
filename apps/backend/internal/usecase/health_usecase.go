package usecase

import "context"

type HealthRepository interface {
	IsReady(ctx context.Context) error
}

type HealthUsecase struct {
	repository HealthRepository
}

func NewHealthUsecase(repository HealthRepository) *HealthUsecase {
	return &HealthUsecase{repository: repository}
}

func (u *HealthUsecase) IsReady(ctx context.Context) error {
	return u.repository.IsReady(ctx)
}
