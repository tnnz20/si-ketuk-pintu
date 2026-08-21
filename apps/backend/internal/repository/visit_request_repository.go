package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"gorm.io/gorm"
)

var ErrVisitRequestNotFound = errors.New("visit request not found")

type VisitRequestRepository struct {
	database *gorm.DB
	logger   *logrus.Logger
}

func NewVisitRequestRepository(database *gorm.DB, logger *logrus.Logger) *VisitRequestRepository {
	return &VisitRequestRepository{database: database, logger: logger}
}

func (r *VisitRequestRepository) CreateAttachment(ctx context.Context, attachment *entity.Attachment) error {
	if err := r.database.WithContext(ctx).Create(attachment).Error; err != nil {
		return fmt.Errorf("create attachment: %w", err)
	}
	return nil
}

func (r *VisitRequestRepository) FindAttachment(ctx context.Context, visitRequestID uuid.UUID, attachmentType string) (*entity.Attachment, error) {
	var attachment entity.Attachment
	err := r.database.WithContext(ctx).Where("visit_request_id = ? AND attachment_type = ?", visitRequestID, attachmentType).First(&attachment).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("find attachment: %w", err)
	}
	return &attachment, nil
}

func (r *VisitRequestRepository) DeleteAttachment(ctx context.Context, attachment *entity.Attachment) error {
	if err := r.database.WithContext(ctx).Delete(&entity.Attachment{}, attachment.ID).Error; err != nil {
		return fmt.Errorf("delete attachment: %w", err)
	}
	return nil
}

func (r *VisitRequestRepository) Create(ctx context.Context, visitRequest *entity.VisitRequest) error {
	return r.database.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(visitRequest).Error; err != nil {
			r.logger.WithError(err).Error("failed to create visit request")
			return fmt.Errorf("create visit request: %w", err)
		}

		return nil
	})
}

func (r *VisitRequestRepository) FindByToken(ctx context.Context, token string) (*entity.VisitRequest, error) {
	var visitRequest entity.VisitRequest
	err := r.database.WithContext(ctx).
		Preload("Guests", func(db *gorm.DB) *gorm.DB {
			return db.Order("guest_order ASC")
		}).
		Preload("Attachments").
		Where("token = ?", token).
		First(&visitRequest).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrVisitRequestNotFound
		}

		r.logger.WithError(err).Error("failed to find visit request by token")
		return nil, fmt.Errorf("find visit request by token: %w", err)
	}

	return &visitRequest, nil
}

func (r *VisitRequestRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.VisitRequest, error) {
	var visitRequest entity.VisitRequest
	err := r.database.WithContext(ctx).
		Preload("Guests", func(db *gorm.DB) *gorm.DB {
			return db.Order("guest_order ASC")
		}).
		Preload("Attachments").
		Preload("AuditEvents", func(db *gorm.DB) *gorm.DB {
			return db.Order("occurred_at DESC")
		}).
		First(&visitRequest, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrVisitRequestNotFound
		}

		r.logger.WithError(err).Error("failed to find visit request by id")
		return nil, fmt.Errorf("find visit request by id: %w", err)
	}

	return &visitRequest, nil
}

func (r *VisitRequestRepository) List(
	ctx context.Context,
	filter model.ListFilter,
) ([]entity.VisitRequest, int64, error) {
	query := r.database.WithContext(ctx).Model(&entity.VisitRequest{})

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}

	if filter.Date != "" {
		query = query.Where("tanggal_kunjungan = ?", filter.Date)
	}

	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		query = query.Where(
			"token ILIKE ? OR nama_instansi ILIKE ? OR pimpinan_rombongan ILIKE ? OR email ILIKE ?",
			searchPattern,
			searchPattern,
			searchPattern,
			searchPattern,
		)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		r.logger.WithError(err).Error("failed to count visit requests")
		return nil, 0, fmt.Errorf("count visit requests: %w", err)
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}

	size := filter.Size
	if size < 1 {
		size = 20
	}

	offset := (page - 1) * size
	visitRequests := []entity.VisitRequest{}
	err := query.
		Order("created_at DESC").
		Offset(offset).
		Limit(size).
		Find(&visitRequests).Error
	if err != nil {
		r.logger.WithError(err).Error("failed to list visit requests")
		return nil, 0, fmt.Errorf("list visit requests: %w", err)
	}

	return visitRequests, total, nil
}

func (r *VisitRequestRepository) UpdateSchedule(ctx context.Context, id uuid.UUID, date time.Time, timeValue string) error {
	result := r.database.WithContext(ctx).Model(&entity.VisitRequest{}).Where("id = ?", id).Updates(map[string]any{
		"tanggal_kunjungan": date,
		"jam_kunjungan":     timeValue,
		"updated_at":        time.Now(),
	})
	if result.Error != nil {
		return fmt.Errorf("update visit request schedule: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrVisitRequestNotFound
	}
	return nil
}

func (r *VisitRequestRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	result := r.database.WithContext(ctx).
		Model(&entity.VisitRequest{}).
		Where("id = ?", id).
		Update("status", status)
	if result.Error != nil {
		r.logger.WithError(result.Error).Error("failed to update visit request status")
		return fmt.Errorf("update visit request status: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return ErrVisitRequestNotFound
	}

	return nil
}

func (r *VisitRequestRepository) Stats(ctx context.Context, now time.Time) (int64, int64, int64, error) {
	var today, pending, total int64
	start := now.Truncate(24 * time.Hour)
	end := start.Add(24 * time.Hour)
	if err := r.database.WithContext(ctx).Model(&entity.VisitRequest{}).Where("created_at >= ? AND created_at < ?", start, end).Count(&today).Error; err != nil {
		return 0, 0, 0, fmt.Errorf("count today's visit requests: %w", err)
	}
	if err := r.database.WithContext(ctx).Model(&entity.VisitRequest{}).Where("status = ?", "pending").Count(&pending).Error; err != nil {
		return 0, 0, 0, fmt.Errorf("count pending visit requests: %w", err)
	}
	if err := r.database.WithContext(ctx).Model(&entity.VisitRequest{}).Count(&total).Error; err != nil {
		return 0, 0, 0, fmt.Errorf("count visit requests: %w", err)
	}
	return today, pending, total, nil
}

func (r *VisitRequestRepository) Delete(ctx context.Context, id uuid.UUID) error {
	var affected int64
	err := r.database.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, model := range []any{&entity.Guest{}, &entity.Attachment{}, &entity.AuditEvent{}} {
			if err := tx.Unscoped().Where("visit_request_id = ?", id).Delete(model).Error; err != nil {
				return fmt.Errorf("delete related records: %w", err)
			}
		}
		result := tx.Delete(&entity.VisitRequest{}, "id = ?", id)
		if result.Error != nil {
			return fmt.Errorf("delete visit request: %w", result.Error)
		}
		affected = result.RowsAffected
		return nil
	})
	if err != nil {
		return err
	}
	if affected == 0 {
		return ErrVisitRequestNotFound
	}
	return nil
}

func (r *VisitRequestRepository) TokenExists(ctx context.Context, token string) (bool, error) {
	var count int64
	err := r.database.WithContext(ctx).
		Model(&entity.VisitRequest{}).
		Where("token = ?", token).
		Count(&count).Error
	if err != nil {
		r.logger.WithError(err).Error("failed to check token exists")
		return false, fmt.Errorf("check token exists: %w", err)
	}

	return count > 0, nil
}
