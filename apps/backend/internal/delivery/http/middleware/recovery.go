package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

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
