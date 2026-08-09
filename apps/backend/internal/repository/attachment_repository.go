package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"gorm.io/gorm"
)

var ErrAttachmentNotFound = errors.New("attachment not found")

type AttachmentRepository struct {
	database *gorm.DB
}

func NewAttachmentRepository(database *gorm.DB) *AttachmentRepository {
	return &AttachmentRepository{database: database}
}

func (r *AttachmentRepository) FindByVisitRequestAndType(
	ctx context.Context,
	visitRequestID uuid.UUID,
	attachmentType string,
) (*entity.Attachment, error) {
	var attachment entity.Attachment
	err := r.database.WithContext(ctx).
		Where("visit_request_id = ? AND attachment_type = ?", visitRequestID, attachmentType).
		First(&attachment).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttachmentNotFound
		}

		return nil, fmt.Errorf("find attachment: %w", err)
	}

	return &attachment, nil
}
