package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredentials = errors.New("invalid username/email or password")

type AdministratorFinder interface {
	FindByIdentifier(ctx context.Context, identifier string) (*entity.Administrator, error)
}

type AuthUsecase struct {
	repository  AdministratorFinder
	jwtSecret   []byte
	jwtExpiry   time.Duration
	logger      *logrus.Logger
}

func NewAuthUsecase(
	repository AdministratorFinder,
	jwtSecret string,
	jwtExpiryHours int,
	logger *logrus.Logger,
) *AuthUsecase {
	return &AuthUsecase{
		repository:  repository,
		jwtSecret:   []byte(jwtSecret),
		jwtExpiry:   time.Duration(jwtExpiryHours) * time.Hour,
		logger:      logger,
	}
}

func (u *AuthUsecase) Login(ctx context.Context, identifier string, password string) (string, error) {
	administrator, err := u.repository.FindByIdentifier(ctx, identifier)
	if err != nil {
		u.logger.WithError(err).WithField("identifier", identifier).Warn("login failed: administrator not found")
		return "", ErrInvalidCredentials
	}

	if !administrator.IsActive {
		u.logger.WithField("administrator_id", administrator.ID).Warn("login failed: administrator not active")
		return "", ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(administrator.PasswordHash), []byte(password)); err != nil {
		u.logger.WithField("administrator_id", administrator.ID).Warn("login failed: invalid password")
		return "", ErrInvalidCredentials
	}

	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   fmt.Sprintf("%d", administrator.ID),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(u.jwtExpiry)),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(u.jwtSecret)
	if err != nil {
		u.logger.WithError(err).Error("failed to sign jwt")
		return "", fmt.Errorf("sign jwt: %w", err)
	}

	return tokenString, nil
}

func (u *AuthUsecase) ValidateToken(tokenString string) (int64, error) {
	token, err := jwt.ParseWithClaims(
		tokenString,
		&jwt.RegisteredClaims{},
		func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				u.logger.WithField("alg", token.Header["alg"]).Warn("unexpected signing method")
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}

			return u.jwtSecret, nil
		},
	)
	if err != nil {
		u.logger.WithError(err).Error("failed to parse jwt")
		return 0, fmt.Errorf("parse jwt: %w", err)
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || !token.Valid {
		u.logger.Warn("invalid token claims")
		return 0, fmt.Errorf("invalid token claims")
	}

	var administratorID int64
	if _, err := fmt.Sscanf(claims.Subject, "%d", &administratorID); err != nil {
		u.logger.WithError(err).Error("failed to parse administrator id from token")
		return 0, fmt.Errorf("parse administrator id from token: %w", err)
	}

	return administratorID, nil
}
