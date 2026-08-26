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
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
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
		requests.GET("/:token/attachments/:type", deps.RateLimiter.Middleware(), deps.VisitRequestController.DownloadAttachment)
		requests.GET("/:token/qr", deps.RateLimiter.Middleware(), deps.VisitRequestController.DownloadQR)
	}

	admin := router.Group("/admin")
	{
		auth := admin.Group("/auth")
		auth.POST("/login", deps.AdminAuthController.Login)

		protected := admin.Group("", middleware.Auth(deps.AuthUsecase))
		{
			protected.GET("/stats", deps.AdminRequestController.Stats)
			requests := protected.Group("/requests")
			requests.GET("", deps.AdminRequestController.List)
			requests.GET("/graph", deps.AdminRequestController.Graph)
			requests.GET("/:id", deps.AdminRequestController.FindByID)
			requests.PATCH("/:id/status", deps.AdminRequestController.UpdateStatus)
			requests.PATCH("/:id/reschedule", deps.AdminRequestController.Reschedule)
			requests.DELETE("/:id", deps.AdminRequestController.Delete)
			requests.GET("/:id/attachments/:type", deps.AdminRequestController.DownloadAttachment)
			requests.POST("/:id/approval-letter", deps.AdminRequestController.UploadApprovalLetter)
			requests.DELETE("/:id/approval-letter", deps.AdminRequestController.DeleteApprovalLetter)
			requests.POST("/:id/reschedule-letter", deps.AdminRequestController.UploadRescheduleLetter)
			requests.DELETE("/:id/reschedule-letter", deps.AdminRequestController.DeleteRescheduleLetter)

			archives := protected.Group("/archives")
			archives.GET("", deps.AdminRequestController.ListArchives)
			archives.POST("/:id/documentations", deps.AdminRequestController.UploadDocumentations)
			archives.DELETE("/:id/documentations/:attachment_id", deps.AdminRequestController.DeleteDocumentation)
			archives.POST("/:id/daftar-absen", deps.AdminRequestController.UploadDaftarAbsen)
			archives.DELETE("/:id/daftar-absen", deps.AdminRequestController.DeleteDaftarAbsen)
			archives.GET("/:id/attachments/:attachment_type/:attachment_id", deps.AdminRequestController.DownloadArchiveAttachment)
		}
	}

	return router
}
