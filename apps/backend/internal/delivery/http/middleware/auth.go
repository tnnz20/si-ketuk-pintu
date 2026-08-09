package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

const AdministratorIDKey = "administrator_id"

func Auth(authUsecase *usecase.AuthUsecase) gin.HandlerFunc {
	return func(context *gin.Context) {
		header := context.GetHeader("Authorization")
		if header == "" {
			context.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			return
		}

		tokenString, found := strings.CutPrefix(header, "Bearer ")
		if !found {
			context.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
			return
		}

		administratorID, err := authUsecase.ValidateToken(tokenString)
		if err != nil {
			context.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		context.Set(AdministratorIDKey, administratorID)
		context.Next()
	}
}
