package persistence

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
	"gorm.io/gorm"
)

type auditEventRepository struct {
	database *gorm.DB
}

// NewAuditEventRepository creates an AuditEventRepository backed by GORM.
func NewAuditEventRepository(database *gorm.DB) repository.AuditEventRepository {
	return &auditEventRepository{database: database}
}

// Create persists a new audit event.
func (r *auditEventRepository) Create(ctx context.Context, event *entity.AuditEvent) error {
	if err := r.database.WithContext(ctx).Create(event).Error; err != nil {
		return fmt.Errorf("create audit event: %w", err)
	}

	return nil
}

// ListByVisitRequest returns all audit events for a visit request, newest
// first.
func (r *auditEventRepository) ListByVisitRequest(
	ctx context.Context,
	visitRequestID uuid.UUID,
) ([]entity.AuditEvent, error) {
	events := []entity.AuditEvent{}
	err := r.database.WithContext(ctx).
		Where("visit_request_id = ?", visitRequestID).
		Order("occurred_at DESC, id DESC").
		Find(&events).Error
	if err != nil {
		return nil, fmt.Errorf("list audit events: %w", err)
	}

	return events, nil
}
