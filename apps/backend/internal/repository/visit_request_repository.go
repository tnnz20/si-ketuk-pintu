package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
)

// ErrVisitRequestNotFound is returned when no visit request matches the lookup.
var ErrVisitRequestNotFound = errors.New("visit request not found")

// ErrAttachmentNotFound is returned when no attachment matches the lookup.
var ErrAttachmentNotFound = errors.New("attachment not found")

// VisitRequestRepository defines persistence operations for visit requests,
// their guests, attachments, and statistics.
type VisitRequestRepository interface {
	Create(ctx context.Context, visitRequest *entity.VisitRequest) error
	FindByToken(ctx context.Context, token string) (*entity.VisitRequest, error)
	FindByID(ctx context.Context, id uuid.UUID) (*entity.VisitRequest, error)
	List(ctx context.Context, filter model.ListFilter) ([]entity.VisitRequest, int64, error)
	UpdateSchedule(ctx context.Context, id uuid.UUID, tanggalKunjungan int64, jamKunjungan int64) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
	Stats(ctx context.Context, start, end int64) (int64, int64, int64, error)
	CountByPeriod(ctx context.Context, period string, year, month int, loc *time.Location) ([]model.GraphPoint, error)
	Delete(ctx context.Context, id uuid.UUID) error
	TokenExists(ctx context.Context, token string) (bool, error)

	CreateAttachment(ctx context.Context, attachment *entity.Attachment) error
	FindAttachment(ctx context.Context, visitRequestID uuid.UUID, attachmentType string) (*entity.Attachment, error)
	FindAttachmentByID(ctx context.Context, visitRequestID uuid.UUID, attachmentID int64) (*entity.Attachment, error)
	ListAttachments(ctx context.Context, visitRequestID uuid.UUID, attachmentType string) ([]entity.Attachment, error)
	DeleteAttachment(ctx context.Context, attachment *entity.Attachment) error
}
