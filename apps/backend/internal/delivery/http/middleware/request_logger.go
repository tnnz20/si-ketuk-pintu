package middleware

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// RequestLogger returns gin middleware that records method, request URI, status,
// latency, client IP, and contextual errors with dynamic Logrus levels.
//
// Log level mapping (inspired by youthpreneur-be):
// - 5xx responses or gin errors: Error level
// - 4xx client errors: Warning level
// - 2xx/3xx successes: Info level
func RequestLogger(logger *logrus.Logger) gin.HandlerFunc {
	return func(context *gin.Context) {
		startedAt := time.Now()
		context.Next()

		status := context.Writer.Status()
		duration := time.Since(startedAt)

		fields := logrus.Fields{
			"component":   "http",
			"duration_ms": duration.Milliseconds(),
			"method":      context.Request.Method,
			"path":        context.Request.URL.RequestURI(),
			"status":      status,
			"remote_addr": context.ClientIP(),
		}

		if len(context.Errors) > 0 {
			fields["errors"] = context.Errors.Errors()
		}

		entry := logger.WithFields(fields)
		switch {
		case status >= http.StatusInternalServerError || len(context.Errors) > 0:
			entry.Error("request failed")
		case status >= http.StatusBadRequest:
			entry.Warn("request completed with client error")
		default:
			entry.Info("request completed")
		}
	}
}
