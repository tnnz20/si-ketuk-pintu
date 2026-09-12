package controllers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

// HealthController serves liveness and readiness probes.
type HealthController struct {
	healthUsecase *usecase.HealthUsecase
}

// NewHealthController creates a HealthController backed by the given
// usecase.
func NewHealthController(healthUsecase *usecase.HealthUsecase) *HealthController {
	return &HealthController{healthUsecase: healthUsecase}
}

// Liveness always reports "ok" while the process is running.
func (c *HealthController) Liveness(context *gin.Context) {
	context.JSON(http.StatusOK, model.HealthResponse{Status: "ok"})
}

// Readiness reports "ready" if the database is reachable within 3 seconds,
// otherwise "unavailable" with HTTP 503.
func (c *HealthController) Readiness(ginContext *gin.Context) {
	ctx, cancel := context.WithTimeout(ginContext.Request.Context(), 3*time.Second)
	defer cancel()

	if err := c.healthUsecase.IsReady(ctx); err != nil {
		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusServiceUnavailable, model.HealthResponse{Status: "unavailable"})
		return
	}

	ginContext.JSON(http.StatusOK, model.HealthResponse{Status: "ready"})
}
