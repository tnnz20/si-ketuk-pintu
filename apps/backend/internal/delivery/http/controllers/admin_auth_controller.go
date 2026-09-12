package controllers

import (
	"context"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

// TurnstileVerifier validates a Cloudflare Turnstile token.
type TurnstileVerifier interface {
	Verify(ctx context.Context, token, remoteIP string) error
}

// AdminAuthController handles admin login requests.
type AdminAuthController struct {
	authUsecase *usecase.AuthUsecase
	logger      *logrus.Logger
	verifier    TurnstileVerifier
}

// NewAdminAuthController creates an AdminAuthController. When verifier is
// non-nil, login requests must pass Turnstile verification first.
func NewAdminAuthController(authUsecase *usecase.AuthUsecase, logger *logrus.Logger, verifier TurnstileVerifier) *AdminAuthController {
	return &AdminAuthController{authUsecase: authUsecase, logger: logger, verifier: verifier}
}

// Login authenticates an administrator with identifier and password and
// returns a JWT, optionally verifying a Turnstile token first.
func (c *AdminAuthController) Login(ginContext *gin.Context) {
	var request model.LoginRequest
	if err := ginContext.ShouldBindJSON(&request); err != nil {
		c.logger.WithError(err).Warn("failed to bind login request")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: err.Error()})
		return
	}

	if c.verifier != nil {
		if err := c.verifier.Verify(ginContext.Request.Context(), request.TurnstileToken, ginContext.ClientIP()); err != nil {
			c.logger.WithError(err).Warn("turnstile verification failed for login")
			ginContext.JSON(http.StatusForbidden, model.ErrorResponse{Error: "turnstile verification failed"})
			return
		}
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
