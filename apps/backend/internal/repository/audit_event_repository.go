package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
)

// AuditEventRepository defines persistence operations for audit trail events.
type AuditEventRepository interface {
	Create(ctx context.Context, event *entity.AuditEvent) error
	ListByVisitRequest(ctx context.Context, visitRequestID uuid.UUID) ([]entity.AuditEvent, error)
}
