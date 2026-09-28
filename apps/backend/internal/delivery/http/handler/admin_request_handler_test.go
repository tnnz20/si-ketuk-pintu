package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/service"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

type listStoreFake struct {
	lastFilter model.ListFilter
	request    *entity.VisitRequest
}

func (s *listStoreFake) Create(context.Context, *entity.VisitRequest) error { return nil }
func (s *listStoreFake) CreateAttachment(context.Context, *entity.Attachment) error {
	return nil
}
func (s *listStoreFake) FindAttachment(context.Context, uuid.UUID, string) (*entity.Attachment, error) {
	return nil, nil
}
func (s *listStoreFake) FindAttachmentByID(context.Context, uuid.UUID, int64) (*entity.Attachment, error) {
	return nil, nil
}
func (s *listStoreFake) ListAttachments(context.Context, uuid.UUID, string) ([]entity.Attachment, error) {
	return nil, nil
}
func (s *listStoreFake) DeleteAttachment(context.Context, *entity.Attachment) error { return nil }
func (s *listStoreFake) FindByToken(context.Context, string) (*entity.VisitRequest, error) {
	return nil, nil
}
func (s *listStoreFake) FindByID(context.Context, uuid.UUID) (*entity.VisitRequest, error) {
	return s.request, nil
}
func (s *listStoreFake) List(_ context.Context, filter model.ListFilter) ([]entity.VisitRequest, int64, error) {
	s.lastFilter = filter
	return nil, 0, nil
}
func (s *listStoreFake) UpdateStatus(context.Context, uuid.UUID, string) error { return nil }
func (s *listStoreFake) UpdateSchedule(context.Context, uuid.UUID, int64, int64) error {
	return nil
}
func (s *listStoreFake) Stats(context.Context, int64, int64) (int64, int64, int64, error) {
	return 0, 0, 0, nil
}
func (s *listStoreFake) CountByPeriod(context.Context, string, int, int, *time.Location) ([]model.GraphPoint, error) {
	return nil, nil
}
func (s *listStoreFake) Delete(context.Context, uuid.UUID) error           { return nil }
func (s *listStoreFake) TokenExists(context.Context, string) (bool, error) { return false, nil }

func TestListMalformedPaginationDefaultsToPage1Size20(t *testing.T) {
	gin.SetMode(gin.TestMode)

	cases := []struct {
		name     string
		page     string
		pageSize string
		wantPage int
		wantSize int
	}{
		{"malformed page", "abc", "3", 1, 3},
		{"malformed page_size", "2", "abc", 2, 20},
		{"nonpositive page", "0", "3", 1, 3},
		{"nonpositive page_size", "2", "-5", 2, 20},
		{"both malformed", "xyz", "xyz", 1, 20},
		{"oversized page_size", "2", "101", 2, 100},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			store := &listStoreFake{}
			logger := logrus.New()
			logger.Out = testDiscard{}
			uc := usecase.NewVisitRequestUsecase(store, nil, logger, nil)
			c := NewAdminRequestHandler(uc, logger, nil)
			router := gin.New()
			router.GET("/requests", c.List)

			url := fmt.Sprintf("/requests?page=%s&page_size=%s", tc.page, tc.pageSize)
			req := httptest.NewRequest(http.MethodGet, url, nil)
			resp := httptest.NewRecorder()
			router.ServeHTTP(resp, req)

			if resp.Code != http.StatusOK {
				t.Fatalf("status = %d, want 200", resp.Code)
			}
			if store.lastFilter.Page != tc.wantPage || store.lastFilter.Size != tc.wantSize {
				t.Fatalf("usecase received page=%d size=%d, want page=%d size=%d", store.lastFilter.Page, store.lastFilter.Size, tc.wantPage, tc.wantSize)
			}

			var body model.VisitRequestListResponse
			if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
				t.Fatalf("unmarshal response: %v", err)
			}
			if body.Page != tc.wantPage || body.PageSize != tc.wantSize {
				t.Fatalf("response page=%d page_size=%d, want %d/%d", body.Page, body.PageSize, tc.wantPage, tc.wantSize)
			}
		})
	}
}

func TestDownloadAttachment_RescheduleLetterStatusGated(t *testing.T) {
	gin.SetMode(gin.TestMode)
	logger := logrus.New()
	logger.Out = testDiscard{}

	reqID := uuid.New()
	store := &listStoreFake{
		request: &entity.VisitRequest{
			ID:     reqID,
			Status: "approved",
		},
	}
	uc := usecase.NewVisitRequestUsecase(store, nil, logger, nil)
	c := NewAdminRequestHandler(uc, logger, nil)

	router := gin.New()
	router.GET("/requests/:id/attachments/:type", c.DownloadAttachment)

	url := fmt.Sprintf("/requests/%s/attachments/surat_reschedule", reqID)
	req := httptest.NewRequest(http.MethodGet, url, nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.Code)
	}

	var body model.ErrorResponse
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}
	if body.Error != "reschedule letter not found" {
		t.Fatalf("error = %q, want 'reschedule letter not found'", body.Error)
	}
}

func TestDownloadAttachment_QuotedFilename(t *testing.T) {
	gin.SetMode(gin.TestMode)
	logger := logrus.New()
	logger.Out = testDiscard{}

	tempDir := t.TempDir()
	subDir := filepath.Join(tempDir, "surat-persetujuan")
	if err := os.MkdirAll(subDir, 0o755); err != nil {
		t.Fatal(err)
	}
	filePath := filepath.Join(subDir, "test.pdf")
	if err := os.WriteFile(filePath, []byte("%PDF-1.4 test"), 0o644); err != nil {
		t.Fatal(err)
	}

	reqID := uuid.New()
	store := &listStoreFake{
		request: &entity.VisitRequest{
			ID:     reqID,
			Status: "approved",
			Attachments: []entity.Attachment{
				{
					AttachmentType: "surat_persetujuan",
					OriginalName:   "Surat Tugas Dinas (1).pdf",
					StorageKey:     "surat-persetujuan/test.pdf",
				},
			},
		},
	}
	uploadSvc := service.NewFileSystemUploadService(tempDir)
	uc := usecase.NewVisitRequestUsecase(store, nil, logger, uploadSvc)
	c := NewAdminRequestHandler(uc, logger, uploadSvc)

	router := gin.New()
	router.GET("/requests/:id/attachments/:type", c.DownloadAttachment)

	url := fmt.Sprintf("/requests/%s/attachments/surat_persetujuan", reqID)
	req := httptest.NewRequest(http.MethodGet, url, nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200, body=%s", resp.Code, resp.Body.String())
	}

	disposition := resp.Header().Get("Content-Disposition")
	expected := `attachment; filename="Surat Tugas Dinas (1).pdf"`
	if disposition != expected {
		t.Fatalf("Content-Disposition = %q, want %q", disposition, expected)
	}
}

type uploadLetterStoreFake struct {
	listStoreFake
	createdAttachment *entity.Attachment
}

func (s *uploadLetterStoreFake) CreateAttachment(_ context.Context, a *entity.Attachment) error {
	a.ID = 42
	s.createdAttachment = a
	return nil
}

func (s *uploadLetterStoreFake) FindAttachment(_ context.Context, _ uuid.UUID, _ string) (*entity.Attachment, error) {
	return nil, nil
}

func TestUploadLetters_ReturnsAttachmentResponse(t *testing.T) {
	gin.SetMode(gin.TestMode)
	logger := logrus.New()
	logger.Out = testDiscard{}

	tempDir := t.TempDir()
	uploadSvc := service.NewFileSystemUploadService(tempDir)

	reqID := uuid.New()
	store := &uploadLetterStoreFake{
		listStoreFake: listStoreFake{
			request: &entity.VisitRequest{
				ID:     reqID,
				Status: "approved",
			},
		},
	}
	uc := usecase.NewVisitRequestUsecase(store, nil, logger, uploadSvc)
	c := NewAdminRequestHandler(uc, logger, uploadSvc)

	router := gin.New()
	router.POST("/requests/:id/approval-letter", c.UploadApprovalLetter)

	// Build multipart request
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("file", "persetujuan.pdf")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := part.Write([]byte("%PDF-1.4 test approval")); err != nil {
		t.Fatal(err)
	}
	writer.Close()

	url := fmt.Sprintf("/requests/%s/approval-letter", reqID)
	req := httptest.NewRequest(http.MethodPost, url, &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201, body=%s", resp.Code, resp.Body.String())
	}

	var jsonMap map[string]any
	if err := json.Unmarshal(resp.Body.Bytes(), &jsonMap); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}
	attMap, ok := jsonMap["attachment"].(map[string]any)
	if !ok {
		t.Fatalf("expected attachment object in response: %v", jsonMap)
	}
	// Verify snake_case keys from model.AttachmentResponse
	if _, hasSnake := attMap["attachment_type"]; !hasSnake {
		t.Errorf("missing snake_case 'attachment_type' in response: %v", attMap)
	}
	if _, hasSnake := attMap["original_name"]; !hasSnake {
		t.Errorf("missing snake_case 'original_name' in response: %v", attMap)
	}
	// Verify internal fields are NOT leaked
	if _, hasStorageKey := attMap["storage_key"]; hasStorageKey {
		t.Errorf("leaked 'storage_key' in response: %v", attMap)
	}
	if _, hasStorageKeyPascal := attMap["StorageKey"]; hasStorageKeyPascal {
		t.Errorf("leaked 'StorageKey' in response: %v", attMap)
	}
}

type testDiscard struct{}

func (testDiscard) Write(p []byte) (int, error) { return len(p), nil }
