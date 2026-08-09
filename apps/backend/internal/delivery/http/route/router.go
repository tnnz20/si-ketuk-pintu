package route

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/delivery/http/controllers"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/delivery/http/middleware"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

type RouterDeps struct {
	Logger                 *logrus.Logger
	CORSOrigins            []string
	RateLimiter            *middleware.RateLimiter
	AuthUsecase            *usecase.AuthUsecase
	HealthController       *controllers.HealthController
	VisitRequestController *controllers.VisitRequestController
	AdminAuthController    *controllers.AdminAuthController
	AdminRequestController *controllers.AdminRequestController
}

func NewRouter(deps RouterDeps) *gin.Engine {
	router := gin.New()
	if err := router.SetTrustedProxies(nil); err != nil {
		panic(err)
	}

	router.Use(middleware.Recovery(deps.Logger))
	router.Use(middleware.RequestLogger(deps.Logger))
	router.Use(cors.New(cors.Config{
		AllowOrigins:     deps.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	router.GET("/healthz", deps.HealthController.Liveness)
	router.GET("/readyz", deps.HealthController.Readiness)

	public := router.Group("/public")
	{
		requests := public.Group("/requests")
		requests.POST("", deps.VisitRequestController.Create)
		requests.GET("/:token", deps.RateLimiter.Middleware(), deps.VisitRequestController.FindByToken)
		requests.GET("/:token/qr", deps.RateLimiter.Middleware(), deps.VisitRequestController.DownloadQR)
	}

	admin := router.Group("/admin")
	{
		auth := admin.Group("/auth")
		auth.POST("/login", deps.AdminAuthController.Login)

		protected := admin.Group("", middleware.Auth(deps.AuthUsecase))
		{
			requests := protected.Group("/requests")
			requests.GET("", deps.AdminRequestController.List)
			requests.GET("/:id", deps.AdminRequestController.FindByID)
			requests.PATCH("/:id/status", deps.AdminRequestController.UpdateStatus)
			requests.GET("/:id/attachments/:type", deps.AdminRequestController.DownloadAttachment)
		}
	}

	return router
}
