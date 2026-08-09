package controllers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

type HealthController struct {
	healthUsecase *usecase.HealthUsecase
}

func NewHealthController(healthUsecase *usecase.HealthUsecase) *HealthController {
	return &HealthController{healthUsecase: healthUsecase}
}

func (c *HealthController) Liveness(context *gin.Context) {
	context.JSON(http.StatusOK, model.HealthResponse{Status: "ok"})
}

func (c *HealthController) Readiness(ginContext *gin.Context) {
	ctx, cancel := context.WithTimeout(ginContext.Request.Context(), 3*time.Second)
	defer cancel()

	if err := c.healthUsecase.IsReady(ctx); err != nil {
		ginContext.JSON(http.StatusServiceUnavailable, model.HealthResponse{Status: "unavailable"})
		return
	}

	ginContext.JSON(http.StatusOK, model.HealthResponse{Status: "ready"})
}
