package service

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
)

var (
	// ErrInvalidPDF is returned when an uploaded file is not a valid PDF.
	ErrInvalidPDF = errors.New("file must be a valid PDF")
	// ErrInvalidImageFile is returned when an uploaded image is not a valid PNG or JPEG.
	ErrInvalidImageFile = errors.New("files must be valid PNG or JPG images")
)

const (
	// MaxPDFSize is the maximum allowed size for individual PDF and image uploads (5 MB).
	MaxPDFSize = 5 * 1024 * 1024
)

// UploadService manages file storage, MIME validation, and deletion.
type UploadService interface {
	SavePDF(attachmentType string, file model.FileInput) (*entity.Attachment, error)
	SaveImage(directory string, file model.FileInput) (*entity.Attachment, error)
	DeleteFile(storageKey string) error
}

type fileSystemUploadService struct {
	baseDir string
}

// NewFileSystemUploadService creates an UploadService backed by the local filesystem.
func NewFileSystemUploadService(baseDir string) UploadService {
	return &fileSystemUploadService{
		baseDir: baseDir,
	}
}

func (s *fileSystemUploadService) SavePDF(
	attachmentType string,
	file model.FileInput,
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
		directory = "daftar-absen"
	default:
		return nil, fmt.Errorf("unsupported attachment type: %s", attachmentType)
	}

	if file.Size > MaxPDFSize {
		return nil, fmt.Errorf("%s: file exceeds 5 MB limit", attachmentType)
	}

	content, err := io.ReadAll(io.LimitReader(file.Reader, MaxPDFSize+1))
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", attachmentType, err)
	}

	if int64(len(content)) > MaxPDFSize {
		return nil, fmt.Errorf("%s: file exceeds 5 MB limit", attachmentType)
	}

	detectedType := http.DetectContentType(content)
	if detectedType != "application/pdf" {
		return nil, fmt.Errorf("%s: %w (detected: %s)", attachmentType, ErrInvalidPDF, detectedType)
	}

	checksum := sha256.Sum256(content)
	checksumHex := hex.EncodeToString(checksum[:])

	filename := fmt.Sprintf("%s_%d.pdf", attachmentType, time.Now().UnixNano())
	storageDir := filepath.Join(s.baseDir, directory)
	if err := os.MkdirAll(storageDir, 0o750); err != nil {
		return nil, fmt.Errorf("create attachment directory %s: %w", storageDir, err)
	}

	info, err := os.Stat(storageDir)
	if err != nil {
		return nil, fmt.Errorf("inspect attachment directory %s: %w", storageDir, err)
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("attachment path is not a directory: %s", storageDir)
	}

	fullPath := filepath.Join(storageDir, filename)
	storageKey := filepath.ToSlash(filepath.Join(directory, filename))
	if err := os.WriteFile(fullPath, content, 0o640); err != nil {
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

func (s *fileSystemUploadService) SaveImage(directory string, file model.FileInput) (*entity.Attachment, error) {
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".png" && ext != ".jpg" && ext != ".jpeg" {
		return nil, fmt.Errorf("%s: %w (unsupported extension)", file.Filename, ErrInvalidImageFile)
	}

	content, err := io.ReadAll(io.LimitReader(file.Reader, MaxPDFSize+1))
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", file.Filename, err)
	}
	if int64(len(content)) > MaxPDFSize {
		return nil, fmt.Errorf("%s: file exceeds 5 MB limit", file.Filename)
	}

	detectedType := http.DetectContentType(content)
	if detectedType != "image/png" && detectedType != "image/jpeg" {
		return nil, fmt.Errorf("%s: %w (detected: %s)", file.Filename, ErrInvalidImageFile, detectedType)
	}

	checksum := sha256.Sum256(content)

	storageDir := filepath.Join(s.baseDir, directory)
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

func (s *fileSystemUploadService) DeleteFile(storageKey string) error {
	fullPath := filepath.Join(s.baseDir, filepath.FromSlash(storageKey))
	if err := os.Remove(fullPath); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}
