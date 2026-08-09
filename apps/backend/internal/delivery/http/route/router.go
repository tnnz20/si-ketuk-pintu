package route

import (
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/delivery/http/controllers"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/delivery/http/middleware"
)

func NewRouter(logger *logrus.Logger, healthController *controllers.HealthController) *gin.Engine {
	router := gin.New()
	if err := router.SetTrustedProxies(nil); err != nil {
		panic(err)
	}

	router.Use(middleware.Recovery(logger))
	router.Use(middleware.RequestLogger(logger))
	router.GET("/healthz", healthController.Liveness)
	router.GET("/readyz", healthController.Readiness)

	return router
}
