package controllers

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

type healthRepositoryStub struct {
	err error
}

func (s healthRepositoryStub) IsReady(context.Context) error {
	return s.err
}

func TestLivenessReturnsOK(t *testing.T) {
	gin.SetMode(gin.TestMode)
	controller := NewHealthController(usecase.NewHealthUsecase(healthRepositoryStub{}))
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodGet, "/healthz", nil)

	controller.Liveness(context)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
}

func TestReadinessReturnsServiceUnavailableWhenDatabaseFails(t *testing.T) {
	gin.SetMode(gin.TestMode)
	controller := NewHealthController(usecase.NewHealthUsecase(healthRepositoryStub{
		err: errors.New("database unavailable"),
	}))
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodGet, "/readyz", nil)

	controller.Readiness(context)

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusServiceUnavailable)
	}
}
