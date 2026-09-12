package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

type listStoreFake struct {
	lastFilter model.ListFilter
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
	return nil, nil
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
			uc := usecase.NewVisitRequestUsecase(store, nil, logger, "")
			c := NewAdminRequestController(uc, logger, "")
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

type testDiscard struct{}

func (testDiscard) Write(p []byte) (int, error) { return len(p), nil }
