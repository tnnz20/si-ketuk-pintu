package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"gorm.io/gorm"
)

// ErrVisitRequestNotFound is returned when no visit request matches the
// lookup.
var ErrVisitRequestNotFound = errors.New("visit request not found")

// VisitRequestRepository stores visit requests, their guests, attachments,
// and audit events using GORM.
type VisitRequestRepository struct {
	database *gorm.DB
}

// NewVisitRequestRepository creates a VisitRequestRepository backed by the
// given database handle.
func NewVisitRequestRepository(database *gorm.DB) *VisitRequestRepository {
	return &VisitRequestRepository{database: database}
}

// CreateAttachment persists a new attachment record.
func (r *VisitRequestRepository) CreateAttachment(ctx context.Context, attachment *entity.Attachment) error {
	if err := r.database.WithContext(ctx).Create(attachment).Error; err != nil {
		return fmt.Errorf("create attachment: %w", err)
	}
	return nil
}

// FindAttachment returns the attachment of the given type for a visit
// request, or (nil, nil) if none exists.
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

// FindAttachmentByID returns the attachment with the given ID belonging to
// a visit request, or (nil, nil) if none exists.
func (r *VisitRequestRepository) FindAttachmentByID(ctx context.Context, visitRequestID uuid.UUID, attachmentID int64) (*entity.Attachment, error) {
	var attachment entity.Attachment
	err := r.database.WithContext(ctx).
		Where("visit_request_id = ? AND id = ?", visitRequestID, attachmentID).
		First(&attachment).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("find attachment by id: %w", err)
	}
	return &attachment, nil
}

// ListAttachments returns all attachments of the given type for a visit
// request, ordered by ID.
func (r *VisitRequestRepository) ListAttachments(ctx context.Context, visitRequestID uuid.UUID, attachmentType string) ([]entity.Attachment, error) {
	attachments := []entity.Attachment{}
	err := r.database.WithContext(ctx).
		Where("visit_request_id = ? AND attachment_type = ?", visitRequestID, attachmentType).
		Order("id ASC").
		Find(&attachments).Error
	if err != nil {
		return nil, fmt.Errorf("list attachments: %w", err)
	}

	return attachments, nil
}

// DeleteAttachment removes the attachment record from the database.
func (r *VisitRequestRepository) DeleteAttachment(ctx context.Context, attachment *entity.Attachment) error {
	if err := r.database.WithContext(ctx).Delete(&entity.Attachment{}, attachment.ID).Error; err != nil {
		return fmt.Errorf("delete attachment: %w", err)
	}
	return nil
}

// Create persists a new visit request with its guests in a transaction.
func (r *VisitRequestRepository) Create(ctx context.Context, visitRequest *entity.VisitRequest) error {
	return r.database.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(visitRequest).Error; err != nil {
			return fmt.Errorf("create visit request: %w", err)
		}

		return nil
	})
}

// FindByToken returns the visit request with the given public token and its
// guests, attachments, and audit events, or ErrVisitRequestNotFound if
// absent.
func (r *VisitRequestRepository) FindByToken(ctx context.Context, token string) (*entity.VisitRequest, error) {
	var visitRequest entity.VisitRequest
	err := r.database.WithContext(ctx).
		Preload("Guests", func(db *gorm.DB) *gorm.DB {
			return db.Order("guest_order ASC")
		}).
		Preload("Attachments").
		Preload("AuditEvents", func(db *gorm.DB) *gorm.DB {
			return db.Order("occurred_at DESC, id DESC")
		}).
		Where("token = ?", token).
		First(&visitRequest).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrVisitRequestNotFound
		}

		return nil, fmt.Errorf("find visit request by token: %w", err)
	}

	return &visitRequest, nil
}

// FindByID returns the visit request with the given UUID and its guests,
// attachments, and audit events, or ErrVisitRequestNotFound if absent.
func (r *VisitRequestRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.VisitRequest, error) {
	var visitRequest entity.VisitRequest
	err := r.database.WithContext(ctx).
		Preload("Guests", func(db *gorm.DB) *gorm.DB {
			return db.Order("guest_order ASC")
		}).
		Preload("Attachments").
		Preload("AuditEvents", func(db *gorm.DB) *gorm.DB {
			return db.Order("occurred_at DESC, id DESC")
		}).
		First(&visitRequest, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrVisitRequestNotFound
		}

		return nil, fmt.Errorf("find visit request by id: %w", err)
	}

	return &visitRequest, nil
}

// List returns the visit requests matching the filter (status, date,
// free-text search) with pagination, plus the total matching count.
func (r *VisitRequestRepository) List(
	ctx context.Context,
	filter model.ListFilter,
) ([]entity.VisitRequest, int64, error) {
	query := r.database.WithContext(ctx).Model(&entity.VisitRequest{})

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}

	if filter.DateEpoch != 0 {
		query = query.Where("tanggal_kunjungan = ?", filter.DateEpoch)
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
		return nil, 0, fmt.Errorf("list visit requests: %w", err)
	}

	return visitRequests, total, nil
}

// UpdateSchedule sets the visit date and time for a request, returning
// ErrVisitRequestNotFound if the request does not exist.
func (r *VisitRequestRepository) UpdateSchedule(ctx context.Context, id uuid.UUID, tanggalKunjungan int64, jamKunjungan int64) error {
	result := r.database.WithContext(ctx).Model(&entity.VisitRequest{}).Where("id = ?", id).Updates(map[string]any{
		"tanggal_kunjungan": tanggalKunjungan,
		"jam_kunjungan":     jamKunjungan,
		"updated_at":        time.Now().UnixMilli(),
	})
	if result.Error != nil {
		return fmt.Errorf("update visit request schedule: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrVisitRequestNotFound
	}
	return nil
}

// UpdateStatus sets the status for a request, returning
// ErrVisitRequestNotFound if the request does not exist.
func (r *VisitRequestRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	result := r.database.WithContext(ctx).
		Model(&entity.VisitRequest{}).
		Where("id = ?", id).
		Update("status", status)
	if result.Error != nil {
		return fmt.Errorf("update visit request status: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return ErrVisitRequestNotFound
	}

	return nil
}

// Stats returns the count of requests created in [start, end), the count of
// pending requests, and the total request count.
func (r *VisitRequestRepository) Stats(ctx context.Context, start, end int64) (int64, int64, int64, error) {
	var today, pending, total int64
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

// CountByPeriod aggregates visit request counts per day ("daily"), per
// month ("monthly"), or per year (any other value) within the range implied
// by year and month, in the given time zone.
func (r *VisitRequestRepository) CountByPeriod(ctx context.Context, period string, year, month int, loc *time.Location) ([]model.GraphPoint, error) {
	var start, end time.Time
	switch period {
	case "daily":
		start = time.Date(year, time.Month(month), 1, 0, 0, 0, 0, loc)
		end = start.AddDate(0, 1, 0)
	case "monthly":
		start = time.Date(year, 1, 1, 0, 0, 0, 0, loc)
		end = start.AddDate(1, 0, 0)
	default:
		var earliest int64
		if err := r.database.WithContext(ctx).Raw("SELECT COALESCE(MIN(created_at), 0) FROM visit_requests").Scan(&earliest).Error; err != nil {
			return nil, fmt.Errorf("find earliest visit request: %w", err)
		}
		if earliest <= 0 {
			now := time.Now().In(loc)
			start = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, loc)
		} else {
			earliestDate := time.UnixMilli(earliest).In(loc)
			start = time.Date(earliestDate.Year(), 1, 1, 0, 0, 0, 0, loc)
		}
		end = time.Now().In(loc).Add(24 * time.Hour)
	}

	points := []model.GraphPoint{}
	if err := r.database.WithContext(ctx).
		Model(&entity.VisitRequest{}).
		Select(
			"(to_timestamp(created_at / 1000.0) AT TIME ZONE ?)::date AS period, COUNT(*) AS count",
			loc.String(),
		).
		Where("created_at >= ? AND created_at < ?", start.UnixMilli(), end.UnixMilli()).
		Group("period").
		Order("period").
		Scan(&points).Error; err != nil {
		return nil, fmt.Errorf("count visit requests by period: %w", err)
	}

	return points, nil
}

// Delete removes a visit request and all its related records in a
// transaction, returning ErrVisitRequestNotFound if the request does not
// exist.
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

// TokenExists reports whether a visit request with the given token exists.
func (r *VisitRequestRepository) TokenExists(ctx context.Context, token string) (bool, error) {
	var count int64
	err := r.database.WithContext(ctx).
		Model(&entity.VisitRequest{}).
		Where("token = ?", token).
		Count(&count).Error
	if err != nil {
		return false, fmt.Errorf("check token exists: %w", err)
	}

	return count > 0, nil
}
