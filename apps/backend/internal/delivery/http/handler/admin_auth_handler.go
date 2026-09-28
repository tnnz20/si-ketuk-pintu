package handler

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

// AdminAuthHandler handles admin login requests.
type AdminAuthHandler struct {
	authUsecase *usecase.AuthUsecase
	logger      *logrus.Logger
	verifier    TurnstileVerifier
}

// NewAdminAuthHandler creates an AdminAuthHandler. When verifier is
// non-nil, login requests must pass Turnstile verification first.
func NewAdminAuthHandler(authUsecase *usecase.AuthUsecase, logger *logrus.Logger, verifier TurnstileVerifier) *AdminAuthHandler {
	return &AdminAuthHandler{authUsecase: authUsecase, logger: logger, verifier: verifier}
}

// Login authenticates an administrator with identifier and password and
// returns a JWT, optionally verifying a Turnstile token first.
func (h *AdminAuthHandler) Login(ginContext *gin.Context) {
	var request model.LoginRequest
	if err := ginContext.ShouldBindJSON(&request); err != nil {
		h.logger.WithError(err).Warn("failed to bind login request")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: err.Error()})
		return
	}

	if h.verifier != nil {
		if err := h.verifier.Verify(ginContext.Request.Context(), request.TurnstileToken, ginContext.ClientIP()); err != nil {
			h.logger.WithError(err).Warn("turnstile verification failed for login")
			ginContext.JSON(http.StatusForbidden, model.ErrorResponse{Error: "turnstile verification failed"})
			return
		}
	}

	tokenString, err := h.authUsecase.Login(ginContext.Request.Context(), request.Identifier, request.Password)
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidCredentials) {
			h.logger.WithField("identifier", request.Identifier).Warn("login failed: invalid credentials")
			ginContext.JSON(http.StatusUnauthorized, model.ErrorResponse{Error: "invalid credentials"})
			return
		}
		h.logger.WithError(err).Error("login failed")
		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	ginContext.JSON(http.StatusOK, model.LoginResponse{Token: tokenString})
}
