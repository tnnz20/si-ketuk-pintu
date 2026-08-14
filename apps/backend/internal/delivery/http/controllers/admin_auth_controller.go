package controllers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

type AdminAuthController struct {
	authUsecase *usecase.AuthUsecase
	logger      *logrus.Logger
}

func NewAdminAuthController(authUsecase *usecase.AuthUsecase, logger *logrus.Logger) *AdminAuthController {
	return &AdminAuthController{authUsecase: authUsecase, logger: logger}
}

func (c *AdminAuthController) Login(ginContext *gin.Context) {
	var request model.LoginRequest
	if err := ginContext.ShouldBindJSON(&request); err != nil {
		c.logger.WithError(err).Warn("failed to bind login request")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: err.Error()})
		return
	}

	tokenString, err := c.authUsecase.Login(ginContext.Request.Context(), request.Identifier, request.Password)
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidCredentials) {
			c.logger.WithField("identifier", request.Identifier).Warn("login failed: invalid credentials")
			ginContext.JSON(http.StatusUnauthorized, model.ErrorResponse{Error: "invalid credentials"})
			return
		}
		c.logger.WithError(err).Error("login failed")
		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	ginContext.JSON(http.StatusOK, model.LoginResponse{Token: tokenString})
}
