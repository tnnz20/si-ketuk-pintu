package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func RequestLogger(logger *logrus.Logger) gin.HandlerFunc {
	return func(context *gin.Context) {
		startedAt := time.Now()
		context.Next()

		logger.WithFields(logrus.Fields{
			"component":   "http",
			"duration_ms": time.Since(startedAt).Milliseconds(),
			"method":      context.Request.Method,
			"path":        context.Request.URL.Path,
			"status":      context.Writer.Status(),
		}).Info("request completed")
	}
}
