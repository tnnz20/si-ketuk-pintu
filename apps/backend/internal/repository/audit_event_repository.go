package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"gorm.io/gorm"
)

type AuditEventRepository struct {
	database *gorm.DB
}

func NewAuditEventRepository(database *gorm.DB) *AuditEventRepository {
	return &AuditEventRepository{database: database}
}

func (r *AuditEventRepository) Create(ctx context.Context, event *entity.AuditEvent) error {
	if err := r.database.WithContext(ctx).Create(event).Error; err != nil {
		return fmt.Errorf("create audit event: %w", err)
	}

	return nil
}

func (r *AuditEventRepository) ListByVisitRequest(
	ctx context.Context,
	visitRequestID uuid.UUID,
) ([]entity.AuditEvent, error) {
	events := []entity.AuditEvent{}
	err := r.database.WithContext(ctx).
		Where("visit_request_id = ?", visitRequestID).
		Order("occurred_at DESC").
		Find(&events).Error
	if err != nil {
		return nil, fmt.Errorf("list audit events: %w", err)
	}

	return events, nil
}
