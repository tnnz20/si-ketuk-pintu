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

		fields := logrus.Fields{
			"component":   "http",
			"duration_ms": time.Since(startedAt).Milliseconds(),
			"method":      context.Request.Method,
			"path":        context.Request.URL.Path,
			"status":      context.Writer.Status(),
		}

		if len(context.Errors) > 0 {
			fields["errors"] = context.Errors.Errors()
			logger.WithFields(fields).Error("request failed")
		} else {
			logger.WithFields(fields).Info("request completed")
		}
	}
}
