package usecase

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
)

type statusStoreStub struct {
	request      *entity.VisitRequest
	updated      string
	graphPoints  []model.GraphPoint
	attachments  map[string]*entity.Attachment // key: type or "type:id"
	imageList    []entity.Attachment
	createErr    error
	createdCount int
}

func attachmentKey(attachmentType string, id int64) string {
	return fmt.Sprintf("%s:%d", attachmentType, id)
}

func (s *statusStoreStub) Create(context.Context, *entity.VisitRequest) error         { return nil }
func (s *statusStoreStub) CreateAttachment(context.Context, *entity.Attachment) error {
	if s.createErr != nil {
		return s.createErr
	}
	s.createdCount++
	return nil
}
func (s *statusStoreStub) FindAttachment(_ context.Context, _ uuid.UUID, attachmentType string) (*entity.Attachment, error) {
	return s.attachments[attachmentKey(attachmentType, 0)], nil
}
func (s *statusStoreStub) FindAttachmentByID(_ context.Context, _ uuid.UUID, attachmentID int64) (*entity.Attachment, error) {
	return s.attachments[attachmentKey("images", attachmentID)], nil
}
func (s *statusStoreStub) ListAttachments(context.Context, uuid.UUID, string) ([]entity.Attachment, error) {
	return s.imageList, nil
}
func (s *statusStoreStub) DeleteAttachment(context.Context, *entity.Attachment) error { return nil }
func (s *statusStoreStub) FindByToken(context.Context, string) (*entity.VisitRequest, error) {
	return nil, nil
}
func (s *statusStoreStub) FindByID(context.Context, uuid.UUID) (*entity.VisitRequest, error) {
	return s.request, nil
}
func (s *statusStoreStub) List(context.Context, model.ListFilter) ([]entity.VisitRequest, int64, error) {
	return nil, 0, nil
}
func (s *statusStoreStub) UpdateStatus(_ context.Context, _ uuid.UUID, status string) error {
	s.updated = status
	return nil
}
func (s *statusStoreStub) UpdateSchedule(context.Context, uuid.UUID, int64, int64) error {
	return nil
}
func (s *statusStoreStub) Stats(context.Context, int64, int64) (int64, int64, int64, error) {
	return 0, 0, 0, nil
}
func (s *statusStoreStub) Delete(context.Context, uuid.UUID) error           { return nil }
func (s *statusStoreStub) TokenExists(context.Context, string) (bool, error) { return false, nil }
func (s *statusStoreStub) CountByPeriod(context.Context, string, int, int, *time.Location) ([]model.GraphPoint, error) {
	return s.graphPoints, nil
}

type auditStub struct {
	event *entity.AuditEvent
	err   error
}

func (s *auditStub) Create(_ context.Context, event *entity.AuditEvent) error {
	s.event = event
	return s.err
}

func TestUpdateStatusCreatesAuditEvent(t *testing.T) {
	store := &statusStoreStub{request: &entity.VisitRequest{Status: "pending"}}
	audit := &auditStub{}
	usecase := NewVisitRequestUsecase(store, audit, logrus.New(), t.TempDir())
	id := uuid.New()
	if err := usecase.UpdateStatus(context.Background(), UpdateStatusInput{VisitRequestID: id, NewStatus: "approved", AdministratorID: 7}); err != nil {
		t.Fatal(err)
	}
	if audit.event == nil || audit.event.Action != "status_changed" {
		t.Fatalf("audit event = %#v", audit.event)
	}
	var previous, next map[string]string
	if err := json.Unmarshal(audit.event.PreviousValue, &previous); err != nil {
		t.Fatal(err)
	}
	if err := json.Unmarshal(audit.event.NewValue, &next); err != nil {
		t.Fatal(err)
	}
	if previous["status"] != "pending" || next["status"] != "approved" {
		t.Fatalf("status audit = %#v -> %#v", previous, next)
	}
}

func TestUpdateStatusReturnsAuditError(t *testing.T) {
	store := &statusStoreStub{request: &entity.VisitRequest{Status: "pending"}}
	audit := &auditStub{err: errors.New("audit failed")}
	usecase := NewVisitRequestUsecase(store, audit, logrus.New(), t.TempDir())
	if err := usecase.UpdateStatus(context.Background(), UpdateStatusInput{VisitRequestID: uuid.New(), NewStatus: "rejected", AdministratorID: 7}); err == nil {
		t.Fatal("expected audit error")
	}
}

func TestVisitRequestUsecase_Graph(t *testing.T) {
	want := []model.GraphPoint{{Period: time.Date(2026, time.August, 18, 0, 0, 0, 0, time.UTC), Count: 1}}
	store := &statusStoreStub{graphPoints: want}
	usecase := NewVisitRequestUsecase(store, nil, logrus.New(), t.TempDir())

	got, err := usecase.Graph(context.Background(), "daily", 2026, 8)
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("Graph() = %#v, want %#v", got, want)
	}
}

func TestSavePDFStoresByAttachmentType(t *testing.T) {
	uploadDir := t.TempDir()
	usecase := NewVisitRequestUsecase(nil, nil, logrus.New(), uploadDir)

	for _, test := range []struct {
		attachmentType string
		directory      string
	}{
		{attachmentType: "surat_kunjungan", directory: "surat-kunjungan"},
		{attachmentType: "surat_tugas", directory: "surat-tugas"},
		{attachmentType: "surat_persetujuan", directory: "surat-persetujuan"},
	} {
		attachment, err := usecase.savePDF(uuid.New(), test.attachmentType, FileInput{
			Reader:   bytes.NewReader([]byte("%PDF-1.4\n%1234567890")),
			Filename: "document.pdf",
		})
		if err != nil {
			t.Fatalf("save %s: %v", test.attachmentType, err)
		}

		storageKey := filepath.ToSlash(attachment.StorageKey)
		prefix := test.directory + "/"
		if !strings.HasPrefix(storageKey, prefix) {
			t.Fatalf("storage key = %q, want prefix %q", storageKey, prefix)
		}
		if !strings.HasPrefix(filepath.Base(storageKey), test.attachmentType+"_") || !strings.HasSuffix(storageKey, ".pdf") {
			t.Fatalf("storage key = %q, want timestamp filename", storageKey)
		}
		if _, err := os.Stat(filepath.Join(uploadDir, filepath.FromSlash(storageKey))); err != nil {
			t.Fatalf("stored file missing: %v", err)
		}
	}
}

func TestSavePDFRejectsDirectoryPathThatIsFile(t *testing.T) {
	uploadDir := t.TempDir()
	if err := os.WriteFile(filepath.Join(uploadDir, "surat-kunjungan"), []byte("not a directory"), 0o640); err != nil {
		t.Fatal(err)
	}

	usecase := NewVisitRequestUsecase(nil, nil, logrus.New(), uploadDir)
	_, err := usecase.savePDF(uuid.New(), "surat_kunjungan", FileInput{
		Reader:   bytes.NewReader([]byte("%PDF-1.4\n%1234567890")),
		Filename: "document.pdf",
	})
	if err == nil {
		t.Fatal("savePDF should reject a directory path that is a file")
	}
}

func TestSavePDFRejectsUnknownAttachmentType(t *testing.T) {
	uploadDir := t.TempDir()
	usecase := NewVisitRequestUsecase(nil, nil, logrus.New(), uploadDir)
	_, err := usecase.savePDF(uuid.New(), "unknown", FileInput{
		Reader:   bytes.NewReader([]byte("%PDF-1.4\n%1234567890")),
		Filename: "document.pdf",
	})
	if err == nil {
		t.Fatal("savePDF should reject unknown attachment type")
	}
}

var pngBytes = []byte{
	0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
}

var jpegBytes = []byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 'J', 'F', 'I', 'F'}

func TestSaveDocumentationImagesAcceptsValidImages(t *testing.T) {
	store := &statusStoreStub{request: &entity.VisitRequest{Status: "approved"}}
	usecase := NewVisitRequestUsecase(store, nil, logrus.New(), t.TempDir())

	created, err := usecase.SaveDocumentationImages(context.Background(), uuid.New(), []FileInput{
		{Reader: bytes.NewReader(pngBytes), Filename: "foto satu.png", Size: int64(len(pngBytes))},
		{Reader: bytes.NewReader(jpegBytes), Filename: "dua.jpg", Size: int64(len(jpegBytes))},
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(created) != 2 {
		t.Fatalf("created = %d, want 2", len(created))
	}
	for _, attachment := range created {
		if attachment.AttachmentType != "images" {
			t.Errorf("attachment type = %q, want images", attachment.AttachmentType)
		}
		if !strings.HasPrefix(attachment.StorageKey, "dokumentasi/") {
			t.Errorf("storage key = %q, want dokumentasi/ prefix", attachment.StorageKey)
		}
	}
}

func TestSaveDocumentationImagesValidation(t *testing.T) {
	bigPNG := make([]byte, maxPDFSize+1)
	copy(bigPNG, pngBytes)

	tests := []struct {
		name    string
		store   *statusStoreStub
		files   []FileInput
		wantErr error
	}{
		{
			name:    "rejects non-image extension",
			store:   &statusStoreStub{request: &entity.VisitRequest{Status: "approved"}},
			files:   []FileInput{{Reader: bytes.NewReader(pngBytes), Filename: "doc.pdf", Size: int64(len(pngBytes))}},
			wantErr: ErrInvalidImageFile,
		},
		{
			name:    "rejects fake image content",
			store:   &statusStoreStub{request: &entity.VisitRequest{Status: "approved"}},
			files:   []FileInput{{Reader: strings.NewReader("hello world"), Filename: "a.png", Size: 11}},
			wantErr: ErrInvalidImageFile,
		},
		{
			name:    "rejects single file over 5 MB",
			store:   &statusStoreStub{request: &entity.VisitRequest{Status: "approved"}},
			files:   []FileInput{{Reader: bytes.NewReader(bigPNG), Filename: "big.png", Size: int64(len(bigPNG))}},
			wantErr: nil,
		},
		{
			name:  "rejects aggregate over 10 MB with existing",
			store: &statusStoreStub{request: &entity.VisitRequest{Status: "approved"}, imageList: []entity.Attachment{{ID: 1, SizeBytes: 6 << 20}}},
			files: []FileInput{
				{Reader: bytes.NewReader(pngBytes), Filename: "a.png", Size: int64(len(pngBytes))},
				{Reader: bytes.NewReader(jpegBytes), Filename: "b.jpg", Size: 5 << 20},
			},
		},
		{
			name:    "rejects non-approved request",
			store:   &statusStoreStub{request: &entity.VisitRequest{Status: "pending"}},
			files:   []FileInput{{Reader: bytes.NewReader(pngBytes), Filename: "a.png"}},
			wantErr: ErrArchiveRequestNotApproved,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			usecase := NewVisitRequestUsecase(test.store, nil, logrus.New(), t.TempDir())
			_, err := usecase.SaveDocumentationImages(context.Background(), uuid.New(), test.files)
			if err == nil {
				t.Fatal("expected error")
			}
			if test.wantErr != nil && !errors.Is(err, test.wantErr) {
				t.Fatalf("err = %v, want %v", err, test.wantErr)
			}
		})
	}
}

func TestSaveDocumentationImagesCleansUpOnDBFailure(t *testing.T) {
	store := &statusStoreStub{
		request:   &entity.VisitRequest{Status: "approved"},
		createErr: errors.New("db down"),
	}
	usecase := NewVisitRequestUsecase(store, nil, logrus.New(), t.TempDir())

	_, err := usecase.SaveDocumentationImages(context.Background(), uuid.New(), []FileInput{
		{Reader: bytes.NewReader(pngBytes), Filename: "a.png"},
	})
	if err == nil {
		t.Fatal("expected db error")
	}
}

func TestSaveDaftarAbsenValidation(t *testing.T) {
	bigPDF := append([]byte("%PDF-1.4"), make([]byte, maxPDFSize)...)

	tests := []struct {
		name       string
		store      *statusStoreStub
		file       FileInput
		wantErr    error
		wantErrSub string
	}{
		{
			name:    "rejects non-pdf content",
			store:   &statusStoreStub{request: &entity.VisitRequest{Status: "approved"}},
			file:    FileInput{Reader: bytes.NewReader(pngBytes), Filename: "absen.png"},
			wantErr: ErrInvalidPDF,
		},
		{
			name:       "rejects pdf over 5 MB",
			store:      &statusStoreStub{request: &entity.VisitRequest{Status: "approved"}},
			file:       FileInput{Reader: bytes.NewReader(bigPDF), Filename: "absen.pdf"},
			wantErrSub: "exceeds 5 MB",
		},
		{
			name:    "rejects duplicate daftar_absen",
			store:   &statusStoreStub{request: &entity.VisitRequest{Status: "approved"}, attachments: map[string]*entity.Attachment{"daftar_absen:0": {ID: 9}}},
			file:    FileInput{Reader: bytes.NewReader([]byte("%PDF-1.4 test")), Filename: "absen.pdf"},
			wantErr: ErrDaftarAbsenExists,
		},
		{
			name:    "rejects non-approved request",
			store:   &statusStoreStub{request: &entity.VisitRequest{Status: "rejected"}},
			file:    FileInput{Reader: bytes.NewReader([]byte("%PDF-1.4 test")), Filename: "absen.pdf"},
			wantErr: ErrArchiveRequestNotApproved,
		},
		{
			name:  "accepts valid pdf on approved request",
			store: &statusStoreStub{request: &entity.VisitRequest{Status: "approved"}},
			file:  FileInput{Reader: bytes.NewReader([]byte("%PDF-1.4 test")), Filename: "absen.pdf"},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			usecase := NewVisitRequestUsecase(test.store, nil, logrus.New(), t.TempDir())
			attachment, err := usecase.SaveDaftarAbsen(context.Background(), uuid.New(), test.file)
			if test.wantErr != nil {
				if !errors.Is(err, test.wantErr) {
					t.Fatalf("err = %v, want %v", err, test.wantErr)
				}
				return
			}
			if test.wantErrSub != "" {
				if err == nil || !strings.Contains(err.Error(), test.wantErrSub) {
					t.Fatalf("err = %v, want substring %q", err, test.wantErrSub)
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if attachment.AttachmentType != "daftar_absen" {
				t.Fatalf("type = %q, want daftar_absen", attachment.AttachmentType)
			}
		})
	}
}
