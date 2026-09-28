package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

// HealthHandler serves liveness and readiness probes.
type HealthHandler struct {
	healthUsecase *usecase.HealthUsecase
}

// NewHealthHandler creates a HealthHandler backed by the given usecase.
func NewHealthHandler(healthUsecase *usecase.HealthUsecase) *HealthHandler {
	return &HealthHandler{healthUsecase: healthUsecase}
}

// Liveness always reports "ok" while the process is running.
func (h *HealthHandler) Liveness(context *gin.Context) {
	context.JSON(http.StatusOK, model.HealthResponse{Status: "ok"})
}

// Readiness reports "ready" if the database is reachable within 3 seconds,
// otherwise "unavailable" with HTTP 503.
func (h *HealthHandler) Readiness(ginContext *gin.Context) {
	ctx, cancel := context.WithTimeout(ginContext.Request.Context(), 3*time.Second)
	defer cancel()

	if err := h.healthUsecase.IsReady(ctx); err != nil {
		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusServiceUnavailable, model.HealthResponse{Status: "unavailable"})
		return
	}

	ginContext.JSON(http.StatusOK, model.HealthResponse{Status: "ready"})
}
