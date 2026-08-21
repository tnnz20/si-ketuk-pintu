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

var ErrInvalidPDF = errors.New("file must be a valid PDF")

type VisitRequestStore interface {
	Create(ctx context.Context, visitRequest *entity.VisitRequest) error
	FindByToken(ctx context.Context, token string) (*entity.VisitRequest, error)
	FindByID(ctx context.Context, id uuid.UUID) (*entity.VisitRequest, error)
	List(ctx context.Context, filter model.ListFilter) ([]entity.VisitRequest, int64, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
	Stats(ctx context.Context, now time.Time) (int64, int64, int64, error)
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

type VisitRequestUsecase struct {
	store     VisitRequestStore
	auditor   AuditEventCreator
	logger    *logrus.Logger
	uploadDir string
	timeZone  *time.Location
}

func NewVisitRequestUsecase(
	store VisitRequestStore,
	auditor AuditEventCreator,
	logger *logrus.Logger,
	uploadDir string,
	timeZone *time.Location,
) *VisitRequestUsecase {
	return &VisitRequestUsecase{
		store:     store,
		auditor:   auditor,
		logger:    logger,
		uploadDir: uploadDir,
		timeZone:  timeZone,
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
	TanggalKunjungan  time.Time
	JamKunjungan      string
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
		OccurredAt:     time.Now().In(u.timeZone),
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
	return u.store.List(ctx, filter)
}

func (u *VisitRequestUsecase) Stats(ctx context.Context) (int64, int64, int64, error) {
	return u.store.Stats(ctx, time.Now().In(u.timeZone))
}

func (u *VisitRequestUsecase) Delete(ctx context.Context, id uuid.UUID) error {
	return u.store.Delete(ctx, id)
}

func (u *VisitRequestUsecase) UpdateStatus(ctx context.Context, input UpdateStatusInput) error {
	visitRequest, err := u.store.FindByID(ctx, input.VisitRequestID)
	if err != nil {
		u.logger.WithError(err).Error("failed to find visit request by ID for status update")
		return err
	}

	previousStatus := visitRequest.Status
	if err := u.store.UpdateStatus(ctx, input.VisitRequestID, input.NewStatus); err != nil {
		u.logger.WithError(err).Error("failed to update visit request status in store")
		return err
	}

	previousValue, _ := json.Marshal(map[string]string{"status": previousStatus})
	newValue, _ := json.Marshal(map[string]string{"status": input.NewStatus})
	_ = u.auditor.Create(ctx, &entity.AuditEvent{
		VisitRequestID:  &input.VisitRequestID,
		AdministratorID: &input.AdministratorID,
		ActorType:       "administrator",
		Action:          "status_changed",
		PreviousValue:   previousValue,
		NewValue:        newValue,
		OccurredAt:      time.Now().In(u.timeZone),
	})

	return nil
}

func (u *VisitRequestUsecase) generateUniqueToken(ctx context.Context) (string, error) {
	now := time.Now().In(u.timeZone)
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
