package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// Recovery returns gin middleware that logs panics and responds with HTTP
// 500 instead of crashing the server.
func Recovery(logger *logrus.Logger) gin.HandlerFunc {
	return func(context *gin.Context) {
		defer func() {
			if recovered := recover(); recovered != nil {
				logger.WithField("panic", recovered).Error("request panicked")
				context.AbortWithStatus(http.StatusInternalServerError)
			}
		}()

		context.Next()
	}
}
