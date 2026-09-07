package usecase

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
)

const (
	tokenAlphabet   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	tokenSuffixLen  = 5
	maxTokenRetries = 10
	maxPDFSize      = 5 << 20 // 5 MB
)

const (
	// maxImagesTotalSize caps the aggregate size of all `images` attachments per request.
	maxImagesTotalSize = 10 << 20 // 10 MB
	documentationDir   = "dokumentasi"
	daftarAbsenDir     = "daftar-absen"
)

var ErrInvalidPDF = errors.New("file must be a valid PDF")
var ErrInvalidDateFilter = errors.New("invalid date filter")
var ErrApprovalLetterNotAllowed = errors.New("approval letter requires approved request")
var ErrApprovalLetterExists = errors.New("approval letter already exists")
var ErrApprovalLetterNotFound = errors.New("approval letter not found")
var ErrRescheduleLetterNotAllowed = errors.New("reschedule letter requires pending request")
var ErrRescheduleLetterNotFound = errors.New("reschedule letter not found")
var ErrArchiveRequestNotApproved = errors.New("archive actions require an approved request")
var ErrDocumentationNotFound = errors.New("documentation image not found")
var ErrDaftarAbsenExists = errors.New("attendance list already exists")
var ErrDaftarAbsenNotFound = errors.New("attendance list not found")
var ErrInvalidImageFile = errors.New("files must be valid PNG or JPG images")

type VisitRequestStore interface {
	Create(ctx context.Context, visitRequest *entity.VisitRequest) error
	CreateAttachment(ctx context.Context, attachment *entity.Attachment) error
	FindAttachment(ctx context.Context, visitRequestID uuid.UUID, attachmentType string) (*entity.Attachment, error)
	FindAttachmentByID(ctx context.Context, visitRequestID uuid.UUID, attachmentID int64) (*entity.Attachment, error)
	ListAttachments(ctx context.Context, visitRequestID uuid.UUID, attachmentType string) ([]entity.Attachment, error)
	DeleteAttachment(ctx context.Context, attachment *entity.Attachment) error
	FindByToken(ctx context.Context, token string) (*entity.VisitRequest, error)
	FindByID(ctx context.Context, id uuid.UUID) (*entity.VisitRequest, error)
	List(ctx context.Context, filter model.ListFilter) ([]entity.VisitRequest, int64, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
	UpdateSchedule(ctx context.Context, id uuid.UUID, tanggalKunjungan int64, jamKunjungan int64) error
	Stats(ctx context.Context, start, end int64) (int64, int64, int64, error)
	CountByPeriod(ctx context.Context, period string, year, month int, loc *time.Location) ([]model.GraphPoint, error)
	Delete(ctx context.Context, id uuid.UUID) error
	TokenExists(ctx context.Context, token string) (bool, error)
}

type AuditEventCreator interface {
	Create(ctx context.Context, event *entity.AuditEvent) error
}

type UpdateStatusInput struct {
	VisitRequestID  uuid.UUID
	NewStatus       string
	AdministratorID int64
}

type RescheduleInput struct {
	VisitRequestID  uuid.UUID
	NewDate         int64
	NewTime         int64
	AdministratorID int64
}

type VisitRequestUsecase struct {
	store     VisitRequestStore
	auditor   AuditEventCreator
	logger    *logrus.Logger
	uploadDir string
}

func NewVisitRequestUsecase(
	store VisitRequestStore,
	auditor AuditEventCreator,
	logger *logrus.Logger,
	uploadDir string,
) *VisitRequestUsecase {
	return &VisitRequestUsecase{
		store:     store,
		auditor:   auditor,
		logger:    logger,
		uploadDir: uploadDir,
	}
}

type FileInput struct {
	Reader   io.Reader
	Filename string
	Size     int64
}

type CreateVisitRequestInput struct {
	Email             string
	NamaInstansi      string
	AlamatInstansi    string
	TanggalKunjungan  int64
	JamKunjungan      int64
	TemaKunjungan     string
	PimpinanRombongan string
	JumlahTamu        int
	KontakDihubungi   string
	Guests            []model.GuestInput
	SuratKunjungan    FileInput
	SuratTugas        FileInput
}

func (u *VisitRequestUsecase) Create(
	ctx context.Context,
	input CreateVisitRequestInput,
) (*entity.VisitRequest, error) {
	if len(input.Guests) != input.JumlahTamu {
		err := fmt.Errorf("guest count (%d) does not match jumlah_tamu (%d)", len(input.Guests), input.JumlahTamu)
		u.logger.WithError(err).Error("invalid guest count")
		return nil, err
	}

	token, err := u.generateUniqueToken(ctx)
	if err != nil {
		u.logger.WithError(err).Error("failed to generate unique token")
		return nil, err
	}

	visitRequest := &entity.VisitRequest{
		Token:             token,
		Email:             input.Email,
		NamaInstansi:      input.NamaInstansi,
		AlamatInstansi:    input.AlamatInstansi,
		TanggalKunjungan:  input.TanggalKunjungan,
		JamKunjungan:      input.JamKunjungan,
		TemaKunjungan:     input.TemaKunjungan,
		PimpinanRombongan: input.PimpinanRombongan,
		JumlahTamu:        input.JumlahTamu,
		KontakDihubungi:   input.KontakDihubungi,
		Status:            "pending",
	}

	guests := make([]entity.Guest, 0, len(input.Guests))
	for i, g := range input.Guests {
		guests = append(guests, entity.Guest{
			GuestOrder: i + 1,
			Nama:       strings.TrimSpace(g.Nama),
			Jabatan:    strings.TrimSpace(g.Jabatan),
		})
	}
	visitRequest.Guests = guests

	suratKunjunganAttachment, err := u.savePDF(visitRequest.ID, "surat_kunjungan", input.SuratKunjungan)
	if err != nil {
		u.logger.WithError(err).Error("failed to save surat_kunjungan")
		return nil, fmt.Errorf("save surat_kunjungan: %w", err)
	}

	suratTugasAttachment, err := u.savePDF(visitRequest.ID, "surat_tugas", input.SuratTugas)
	if err != nil {
		u.logger.WithError(err).Error("failed to save surat_tugas")
		return nil, fmt.Errorf("save surat_tugas: %w", err)
	}

	visitRequest.Attachments = []entity.Attachment{*suratKunjunganAttachment, *suratTugasAttachment}

	if err := u.store.Create(ctx, visitRequest); err != nil {
		u.logger.WithError(err).Error("failed to create visit request in store")
		return nil, err
	}

	auditValue, _ := json.Marshal(map[string]string{"status": "pending"})
	_ = u.auditor.Create(ctx, &entity.AuditEvent{
		VisitRequestID: &visitRequest.ID,
		ActorType:      "visitor",
		Action:         "request_submitted",
		PreviousValue:  json.RawMessage("{}"),
		NewValue:       auditValue,
		OccurredAt:     time.Now().UnixMilli(),
	})

	return visitRequest, nil
}

func (u *VisitRequestUsecase) FindByToken(ctx context.Context, token string) (*entity.VisitRequest, error) {
	return u.store.FindByToken(ctx, token)
}

func (u *VisitRequestUsecase) FindByID(ctx context.Context, id uuid.UUID) (*entity.VisitRequest, error) {
	return u.store.FindByID(ctx, id)
}

func (u *VisitRequestUsecase) List(
	ctx context.Context,
	filter model.ListFilter,
) ([]entity.VisitRequest, int64, error) {
	if filter.Date != "" {
		parsed, err := time.ParseInLocation("2006-01-02", filter.Date, model.WITATimeZone)
		if err != nil {
			return nil, 0, fmt.Errorf("%w: date must be in YYYY-MM-DD format", ErrInvalidDateFilter)
		}
		filter.DateEpoch = parsed.UnixMilli()
	}
	return u.store.List(ctx, filter)
}

func (u *VisitRequestUsecase) Stats(ctx context.Context) (int64, int64, int64, error) {
	now := time.Now().In(model.WITATimeZone)
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, model.WITATimeZone).UnixMilli()
	return u.store.Stats(ctx, start, start+24*60*60*1000)
}

func (u *VisitRequestUsecase) Graph(ctx context.Context, period string, year, month int) ([]model.GraphPoint, error) {
	return u.store.CountByPeriod(ctx, period, year, month, model.WITATimeZone)
}

func (u *VisitRequestUsecase) Delete(ctx context.Context, id uuid.UUID) error {
	return u.store.Delete(ctx, id)
}

func (u *VisitRequestUsecase) SaveApprovalLetter(ctx context.Context, requestID uuid.UUID, file FileInput) (*entity.Attachment, error) {
	request, err := u.store.FindByID(ctx, requestID)
	if err != nil {
		return nil, err
	}
	if request.Status != "approved" {
		return nil, ErrApprovalLetterNotAllowed
	}
	existing, err := u.store.FindAttachment(ctx, requestID, "surat_persetujuan")
	if err == nil && existing != nil {
		return nil, ErrApprovalLetterExists
	}
	if err != nil {
		return nil, err
	}

	attachment, err := u.savePDF(requestID, "surat_persetujuan", file)
	if err != nil {
		return nil, err
	}
	attachment.VisitRequestID = requestID
	if err := u.store.CreateAttachment(ctx, attachment); err != nil {
		_ = os.Remove(filepath.Join(u.uploadDir, filepath.FromSlash(attachment.StorageKey)))
		return nil, err
	}
	return attachment, nil
}

func (u *VisitRequestUsecase) SaveRescheduleLetter(ctx context.Context, requestID uuid.UUID, file FileInput) (*entity.Attachment, error) {
	request, err := u.store.FindByID(ctx, requestID)
	if err != nil {
		return nil, err
	}
	if request.Status != "pending" {
		return nil, ErrRescheduleLetterNotAllowed
	}
	if existing, err := u.store.FindAttachment(ctx, requestID, "surat_reschedule"); err == nil && existing != nil {
		_ = os.Remove(filepath.Join(u.uploadDir, filepath.FromSlash(existing.StorageKey)))
		if err := u.store.DeleteAttachment(ctx, existing); err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}
	attachment, err := u.savePDF(requestID, "surat_reschedule", file)
	if err != nil {
		return nil, err
	}
	attachment.VisitRequestID = requestID
	if err := u.store.CreateAttachment(ctx, attachment); err != nil {
		_ = os.Remove(filepath.Join(u.uploadDir, filepath.FromSlash(attachment.StorageKey)))
		return nil, err
	}
	return attachment, nil
}

func (u *VisitRequestUsecase) DeleteRescheduleLetter(ctx context.Context, requestID uuid.UUID) error {
	attachment, err := u.store.FindAttachment(ctx, requestID, "surat_reschedule")
	if err != nil {
		return err
	}
	if attachment == nil {
		return ErrRescheduleLetterNotFound
	}
	if err := os.Remove(filepath.Join(u.uploadDir, filepath.FromSlash(attachment.StorageKey))); err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("delete reschedule letter file: %w", err)
	}
	return u.store.DeleteAttachment(ctx, attachment)
}

func (u *VisitRequestUsecase) DeleteApprovalLetter(ctx context.Context, requestID uuid.UUID) error {
	attachment, err := u.store.FindAttachment(ctx, requestID, "surat_persetujuan")
	if err != nil {
		return err
	}
	if attachment == nil {
		return ErrApprovalLetterNotFound
	}
	if err := os.Remove(filepath.Join(u.uploadDir, filepath.FromSlash(attachment.StorageKey))); err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("delete approval letter file: %w", err)
	}
	return u.store.DeleteAttachment(ctx, attachment)
}

func (u *VisitRequestUsecase) SaveDocumentationImages(ctx context.Context, requestID uuid.UUID, files []FileInput) ([]entity.Attachment, error) {
	request, err := u.store.FindByID(ctx, requestID)
	if err != nil {
		return nil, err
	}
	if request.Status != "approved" {
		return nil, ErrArchiveRequestNotApproved
	}

	existing, err := u.store.ListAttachments(ctx, requestID, "images")
	if err != nil {
		return nil, err
	}

	var existingTotal int64
	for _, attachment := range existing {
		existingTotal += attachment.SizeBytes
	}

	var incomingTotal int64
	for _, file := range files {
		if file.Size > maxPDFSize {
			return nil, fmt.Errorf("%s: file exceeds 5 MB limit", file.Filename)
		}
		incomingTotal += file.Size
	}
	if existingTotal+incomingTotal > maxImagesTotalSize {
		return nil, fmt.Errorf("total documentation size exceeds 10 MB limit (existing: %d bytes)", existingTotal)
	}

	created := make([]entity.Attachment, 0, len(files))
	for _, file := range files {
		attachment, err := u.saveImage(documentationDir, file)
		if err != nil {
			u.cleanupDocumentation(ctx, created)
			return nil, err
		}
		attachment.AttachmentType = "images"
		attachment.VisitRequestID = requestID
		if err := u.store.CreateAttachment(ctx, attachment); err != nil {
			u.cleanupDocumentation(ctx, created)
			return nil, err
		}
		created = append(created, *attachment)
	}

	return created, nil
}

func (u *VisitRequestUsecase) cleanupDocumentation(ctx context.Context, created []entity.Attachment) {
	for i := range created {
		attachment := &created[i]
		if u.store.DeleteAttachment(ctx, attachment) == nil {
			_ = os.Remove(filepath.Join(u.uploadDir, filepath.FromSlash(attachment.StorageKey)))
		}
	}
}

func (u *VisitRequestUsecase) DeleteDocumentationImage(ctx context.Context, requestID uuid.UUID, attachmentID int64) error {
	attachment, err := u.store.FindAttachmentByID(ctx, requestID, attachmentID)
	if err != nil {
		return err
	}
	if attachment == nil || attachment.AttachmentType != "images" {
		return ErrDocumentationNotFound
	}
	if err := os.Remove(filepath.Join(u.uploadDir, filepath.FromSlash(attachment.StorageKey))); err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("delete documentation image file: %w", err)
	}
	return u.store.DeleteAttachment(ctx, attachment)
}

func (u *VisitRequestUsecase) SaveDaftarAbsen(ctx context.Context, requestID uuid.UUID, file FileInput) (*entity.Attachment, error) {
	request, err := u.store.FindByID(ctx, requestID)
	if err != nil {
		return nil, err
	}
	if request.Status != "approved" {
		return nil, ErrArchiveRequestNotApproved
	}
	if existing, err := u.store.FindAttachment(ctx, requestID, "daftar_absen"); err != nil {
		return nil, err
	} else if existing != nil {
		return nil, ErrDaftarAbsenExists
	}

	attachment, err := u.savePDF(requestID, "daftar_absen", file)
	if err != nil {
		return nil, err
	}
	attachment.VisitRequestID = requestID
	if err := u.store.CreateAttachment(ctx, attachment); err != nil {
		_ = os.Remove(filepath.Join(u.uploadDir, filepath.FromSlash(attachment.StorageKey)))
		return nil, err
	}
	return attachment, nil
}

func (u *VisitRequestUsecase) DeleteDaftarAbsen(ctx context.Context, requestID uuid.UUID) error {
	attachment, err := u.store.FindAttachment(ctx, requestID, "daftar_absen")
	if err != nil {
		return err
	}
	if attachment == nil {
		return ErrDaftarAbsenNotFound
	}
	if err := os.Remove(filepath.Join(u.uploadDir, filepath.FromSlash(attachment.StorageKey))); err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("delete attendance list file: %w", err)
	}
	return u.store.DeleteAttachment(ctx, attachment)
}

func (u *VisitRequestUsecase) GetArchiveAttachment(ctx context.Context, requestID uuid.UUID, attachmentID int64, expectedType string) (*entity.Attachment, error) {
	request, err := u.store.FindByID(ctx, requestID)
	if err != nil {
		return nil, err
	}
	if request.Status != "approved" {
		return nil, ErrArchiveRequestNotApproved
	}

	attachment, err := u.store.FindAttachmentByID(ctx, requestID, attachmentID)
	if err != nil {
		return nil, err
	}
	if attachment == nil || attachment.AttachmentType != expectedType {
		return nil, ErrDocumentationNotFound
	}

	return attachment, nil
}

func (u *VisitRequestUsecase) Reschedule(ctx context.Context, input RescheduleInput) error {
	request, err := u.store.FindByID(ctx, input.VisitRequestID)
	if err != nil {
		return err
	}
	if request.Status != "pending" {
		return fmt.Errorf("only pending requests can be rescheduled")
	}
	previousValue, _ := json.Marshal(map[string]int64{
		"tanggal_kunjungan": request.TanggalKunjungan,
		"jam_kunjungan":     request.JamKunjungan,
	})
	newValue, _ := json.Marshal(map[string]int64{
		"tanggal_kunjungan": input.NewDate,
		"jam_kunjungan":     input.NewTime,
	})
	if err := u.store.UpdateSchedule(ctx, input.VisitRequestID, input.NewDate, input.NewTime); err != nil {
		return err
	}
	return u.auditor.Create(ctx, &entity.AuditEvent{
		VisitRequestID:  &input.VisitRequestID,
		AdministratorID: &input.AdministratorID,
		ActorType:       "administrator",
		Action:          "schedule_rescheduled",
		PreviousValue:   previousValue,
		NewValue:        newValue,
		OccurredAt:      time.Now().UnixMilli(),
	})
}

func (u *VisitRequestUsecase) UpdateStatus(ctx context.Context, input UpdateStatusInput) error {
	visitRequest, err := u.store.FindByID(ctx, input.VisitRequestID)
	if err != nil {
		u.logger.WithError(err).Error("failed to find visit request by ID for status update")
		return err
	}

	previousStatus := visitRequest.Status
	if previousStatus != "pending" || (input.NewStatus != "approved" && input.NewStatus != "rejected") {
		return fmt.Errorf("status transition from %s to %s is not allowed", previousStatus, input.NewStatus)
	}
	if err := u.store.UpdateStatus(ctx, input.VisitRequestID, input.NewStatus); err != nil {
		u.logger.WithError(err).Error("failed to update visit request status in store")
		return err
	}

	previousValue, _ := json.Marshal(map[string]string{"status": previousStatus})
	newValue, _ := json.Marshal(map[string]string{"status": input.NewStatus})
	if err := u.auditor.Create(ctx, &entity.AuditEvent{
		VisitRequestID:  &input.VisitRequestID,
		AdministratorID: &input.AdministratorID,
		ActorType:       "administrator",
		Action:          "status_changed",
		PreviousValue:   previousValue,
		NewValue:        newValue,
		OccurredAt:      time.Now().UnixMilli(),
	}); err != nil {
		u.logger.WithError(err).Error("failed to create status change audit event")
		return fmt.Errorf("create status change audit event: %w", err)
	}

	return nil
}

func (u *VisitRequestUsecase) generateUniqueToken(ctx context.Context) (string, error) {
	now := time.Now().In(model.WITATimeZone)
	datePrefix := fmt.Sprintf("SKP-%s-", now.Format("20060102"))

	for range maxTokenRetries {
		suffix, err := randomAlphanumeric(tokenSuffixLen)
		if err != nil {
			u.logger.WithError(err).Error("failed to generate token suffix")
			return "", fmt.Errorf("generate token suffix: %w", err)
		}

		token := datePrefix + suffix
		exists, err := u.store.TokenExists(ctx, token)
		if err != nil {
			u.logger.WithError(err).Error("failed to check token existence")
			return "", err
		}

		if !exists {
			return token, nil
		}
	}

	err := fmt.Errorf("failed to generate unique token after %d attempts", maxTokenRetries)
	u.logger.WithError(err).Error("token generation exhausted retries")
	return "", err
}

func randomAlphanumeric(length int) (string, error) {
	alphabetLen := big.NewInt(int64(len(tokenAlphabet)))
	result := make([]byte, length)
	for i := range result {
		index, err := rand.Int(rand.Reader, alphabetLen)
		if err != nil {
			return "", err
		}

		result[i] = tokenAlphabet[index.Int64()]
	}

	return string(result), nil
}

func (u *VisitRequestUsecase) savePDF(
	visitRequestID uuid.UUID,
	attachmentType string,
	file FileInput,
) (*entity.Attachment, error) {
	var directory string
	switch attachmentType {
	case "surat_kunjungan":
		directory = "surat-kunjungan"
	case "surat_tugas":
		directory = "surat-tugas"
	case "surat_persetujuan":
		directory = "surat-persetujuan"
	case "surat_reschedule":
		directory = "surat-reschedule"
	case "daftar_absen":
		directory = daftarAbsenDir
	default:
		err := fmt.Errorf("unsupported attachment type: %s", attachmentType)
		u.logger.WithError(err).Error("unsupported attachment type in savePDF")
		return nil, err
	}

	if file.Size > maxPDFSize {
		err := fmt.Errorf("%s: file exceeds 5 MB limit", attachmentType)
		u.logger.WithError(err).Error("file size exceeds limit in savePDF")
		return nil, err
	}

	content, err := io.ReadAll(io.LimitReader(file.Reader, maxPDFSize+1))
	if err != nil {
		u.logger.WithError(err).Error("failed to read file content")
		return nil, fmt.Errorf("read %s: %w", attachmentType, err)
	}

	if int64(len(content)) > maxPDFSize {
		err := fmt.Errorf("%s: file exceeds 5 MB limit", attachmentType)
		u.logger.WithError(err).Error("file content exceeds limit in savePDF")
		return nil, err
	}

	detectedType := http.DetectContentType(content)
	if detectedType != "application/pdf" {
		err := fmt.Errorf("%s: %w (detected: %s)", attachmentType, ErrInvalidPDF, detectedType)
		u.logger.WithError(err).Error("invalid file type detected")
		return nil, err
	}

	checksum := sha256.Sum256(content)
	checksumHex := hex.EncodeToString(checksum[:])

	filename := fmt.Sprintf("%s_%d.pdf", attachmentType, time.Now().UnixNano())
	storageDir := filepath.Join(u.uploadDir, directory)
	if err := os.MkdirAll(storageDir, 0o750); err != nil {
		u.logger.WithError(err).Error("failed to ensure attachment directory exists")
		return nil, fmt.Errorf("create attachment directory %s: %w", storageDir, err)
	}

	info, err := os.Stat(storageDir)
	if err != nil {
		u.logger.WithError(err).Error("failed to inspect attachment directory")
		return nil, fmt.Errorf("inspect attachment directory %s: %w", storageDir, err)
	}
	if !info.IsDir() {
		err := fmt.Errorf("attachment path is not a directory: %s", storageDir)
		u.logger.WithError(err).Error("invalid attachment directory")
		return nil, err
	}

	fullPath := filepath.Join(storageDir, filename)
	storageKey := filepath.ToSlash(filepath.Join(directory, filename))
	if err := os.WriteFile(fullPath, content, 0o640); err != nil {
		u.logger.WithError(err).Error("failed to write file")
		return nil, fmt.Errorf("write %s: %w", attachmentType, err)
	}

	return &entity.Attachment{
		AttachmentType: attachmentType,
		OriginalName:   file.Filename,
		StorageKey:     storageKey,
		ContentType:    "application/pdf",
		SizeBytes:      int64(len(content)),
		ChecksumSHA256: checksumHex,
	}, nil
}

func (u *VisitRequestUsecase) saveImage(directory string, file FileInput) (*entity.Attachment, error) {
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".png" && ext != ".jpg" && ext != ".jpeg" {
		return nil, fmt.Errorf("%s: %w (unsupported extension)", file.Filename, ErrInvalidImageFile)
	}

	content, err := io.ReadAll(io.LimitReader(file.Reader, maxPDFSize+1))
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", file.Filename, err)
	}
	if int64(len(content)) > maxPDFSize {
		return nil, fmt.Errorf("%s: file exceeds 5 MB limit", file.Filename)
	}

	detectedType := http.DetectContentType(content)
	if detectedType != "image/png" && detectedType != "image/jpeg" {
		return nil, fmt.Errorf("%s: %w (detected: %s)", file.Filename, ErrInvalidImageFile, detectedType)
	}

	checksum := sha256.Sum256(content)

	storageDir := filepath.Join(u.uploadDir, directory)
	if err := os.MkdirAll(storageDir, 0o750); err != nil {
		return nil, fmt.Errorf("create attachment directory %s: %w", storageDir, err)
	}
	if info, err := os.Stat(storageDir); err != nil || !info.IsDir() {
		return nil, fmt.Errorf("invalid attachment directory %s", storageDir)
	}

	filename := uuid.NewString() + ".png"
	if detectedType == "image/jpeg" {
		filename = uuid.NewString() + ".jpg"
	}
	fullPath := filepath.Join(storageDir, filename)
	storageKey := filepath.ToSlash(filepath.Join(directory, filename))
	if err := os.WriteFile(fullPath, content, 0o640); err != nil {
		return nil, fmt.Errorf("write %s: %w", file.Filename, err)
	}

	return &entity.Attachment{
		OriginalName:   filepath.Base(file.Filename),
		StorageKey:     storageKey,
		ContentType:    detectedType,
		SizeBytes:      int64(len(content)),
		ChecksumSHA256: hex.EncodeToString(checksum[:]),
	}, nil
}
