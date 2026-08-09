package controllers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

type AdminAuthController struct {
	authUsecase *usecase.AuthUsecase
}

func NewAdminAuthController(authUsecase *usecase.AuthUsecase) *AdminAuthController {
	return &AdminAuthController{authUsecase: authUsecase}
}

func (c *AdminAuthController) Login(ginContext *gin.Context) {
	var request model.LoginRequest
	if err := ginContext.ShouldBindJSON(&request); err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: err.Error()})
		return
	}

	tokenString, err := c.authUsecase.Login(ginContext.Request.Context(), request.Identifier, request.Password)
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidCredentials) {
			ginContext.JSON(http.StatusUnauthorized, model.ErrorResponse{Error: "invalid credentials"})
			return
		}
		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	ginContext.JSON(http.StatusOK, model.LoginResponse{Token: tokenString})
}
