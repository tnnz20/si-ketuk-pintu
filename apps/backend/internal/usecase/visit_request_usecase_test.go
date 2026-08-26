package usecase

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
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
	request     *entity.VisitRequest
	updated     string
	graphPoints []model.GraphPoint
}

func (s *statusStoreStub) Create(context.Context, *entity.VisitRequest) error         { return nil }
func (s *statusStoreStub) CreateAttachment(context.Context, *entity.Attachment) error { return nil }
func (s *statusStoreStub) FindAttachment(context.Context, uuid.UUID, string) (*entity.Attachment, error) {
	return nil, nil
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
func (s *statusStoreStub) UpdateSchedule(context.Context, uuid.UUID, time.Time, string) error {
	return nil
}
func (s *statusStoreStub) Stats(context.Context, time.Time) (int64, int64, int64, error) {
	return 0, 0, 0, nil
}
func (s *statusStoreStub) Delete(context.Context, uuid.UUID) error           { return nil }
func (s *statusStoreStub) TokenExists(context.Context, string) (bool, error) { return false, nil }
func (s *statusStoreStub) CountByPeriod(context.Context, string, int, int, string) ([]model.GraphPoint, error) {
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
	usecase := NewVisitRequestUsecase(store, audit, logrus.New(), t.TempDir(), time.UTC)
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
	usecase := NewVisitRequestUsecase(store, audit, logrus.New(), t.TempDir(), time.UTC)
	if err := usecase.UpdateStatus(context.Background(), UpdateStatusInput{VisitRequestID: uuid.New(), NewStatus: "rejected", AdministratorID: 7}); err == nil {
		t.Fatal("expected audit error")
	}
}

func TestVisitRequestUsecase_Graph(t *testing.T) {
	want := []model.GraphPoint{{Period: time.Date(2026, time.August, 18, 0, 0, 0, 0, time.UTC), Count: 1}}
	store := &statusStoreStub{graphPoints: want}
	usecase := NewVisitRequestUsecase(store, nil, logrus.New(), t.TempDir(), time.UTC)

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
	usecase := NewVisitRequestUsecase(nil, nil, logrus.New(), uploadDir, nil)

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

	usecase := NewVisitRequestUsecase(nil, nil, logrus.New(), uploadDir, nil)
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
	usecase := NewVisitRequestUsecase(nil, nil, logrus.New(), uploadDir, nil)
	_, err := usecase.savePDF(uuid.New(), "unknown", FileInput{
		Reader:   bytes.NewReader([]byte("%PDF-1.4\n%1234567890")),
		Filename: "document.pdf",
	})
	if err == nil {
		t.Fatal("savePDF should reject unknown attachment type")
	}
}
