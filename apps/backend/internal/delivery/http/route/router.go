package route

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/delivery/http/handler"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/delivery/http/middleware"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

// RouterDeps holds the handlers, middleware, and config the router
// wires into routes.
type RouterDeps struct {
	Logger              *logrus.Logger
	CORSOrigins         []string
	RateLimiter         *middleware.RateLimiter
	AuthUsecase         *usecase.AuthUsecase
	HealthHandler       *handler.HealthHandler
	VisitRequestHandler *handler.VisitRequestHandler
	AdminAuthHandler    *handler.AdminAuthHandler
	AdminRequestHandler *handler.AdminRequestHandler
}

// NewRouter builds the gin engine with CORS, rate limiting, logging, and
// recovery middleware, and registers public, health, and admin routes.
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

	api := router.Group("/api")
	api.GET("/healthz", deps.HealthHandler.Liveness)
	api.GET("/readyz", deps.HealthHandler.Readiness)

	public := api.Group("/public")
	{
		requests := public.Group("/requests")
		requests.POST("", deps.RateLimiter.Middleware(), deps.VisitRequestHandler.Create)
		requests.GET("/:token", deps.RateLimiter.Middleware(), deps.VisitRequestHandler.FindByToken)
		requests.GET("/:token/attachments/:type", deps.RateLimiter.Middleware(), deps.VisitRequestHandler.DownloadAttachment)
		requests.GET("/:token/attachments/:type/:attachment_id", deps.RateLimiter.Middleware(), deps.VisitRequestHandler.DownloadAttachment)
		requests.GET("/:token/qr", deps.RateLimiter.Middleware(), deps.VisitRequestHandler.DownloadQR)
	}

	admin := api.Group("/admin")
	{
		auth := admin.Group("/auth")
		auth.POST("/login", deps.RateLimiter.Middleware(), deps.AdminAuthHandler.Login)

		protected := admin.Group("", middleware.Auth(deps.AuthUsecase))
		{
			protected.GET("/stats", deps.AdminRequestHandler.Stats)
			requests := protected.Group("/requests")
			requests.GET("", deps.AdminRequestHandler.List)
			requests.GET("/graph", deps.AdminRequestHandler.Graph)
			requests.GET("/:id", deps.AdminRequestHandler.FindByID)
			requests.PATCH("/:id/status", deps.AdminRequestHandler.UpdateStatus)
			requests.PATCH("/:id/reschedule", deps.AdminRequestHandler.Reschedule)
			requests.DELETE("/:id", deps.AdminRequestHandler.Delete)
			requests.GET("/:id/attachments/:type", deps.AdminRequestHandler.DownloadAttachment)
			requests.POST("/:id/approval-letter", deps.AdminRequestHandler.UploadApprovalLetter)
			requests.DELETE("/:id/approval-letter", deps.AdminRequestHandler.DeleteApprovalLetter)
			requests.POST("/:id/reschedule-letter", deps.AdminRequestHandler.UploadRescheduleLetter)
			requests.DELETE("/:id/reschedule-letter", deps.AdminRequestHandler.DeleteRescheduleLetter)

			archives := protected.Group("/archives")
			archives.GET("", deps.AdminRequestHandler.ListArchives)
			archives.POST("/:id/documentations", deps.AdminRequestHandler.UploadDocumentations)
			archives.DELETE("/:id/documentations/:attachment_id", deps.AdminRequestHandler.DeleteDocumentation)
			archives.POST("/:id/daftar-absen", deps.AdminRequestHandler.UploadDaftarAbsen)
			archives.DELETE("/:id/daftar-absen", deps.AdminRequestHandler.DeleteDaftarAbsen)
			archives.GET("/:id/attachments/:attachment_type/:attachment_id", deps.AdminRequestHandler.DownloadArchiveAttachment)
		}
	}

	return router
}
