package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
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
}

func NewAuthUsecase(
	repository AdministratorFinder,
	jwtSecret string,
	jwtExpiryHours int,
) *AuthUsecase {
	return &AuthUsecase{
		repository:  repository,
		jwtSecret:   []byte(jwtSecret),
		jwtExpiry:   time.Duration(jwtExpiryHours) * time.Hour,
	}
}

func (u *AuthUsecase) Login(ctx context.Context, identifier string, password string) (string, error) {
	administrator, err := u.repository.FindByIdentifier(ctx, identifier)
	if err != nil {
		return "", ErrInvalidCredentials
	}

	if !administrator.IsActive {
		return "", ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(administrator.PasswordHash), []byte(password)); err != nil {
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
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}

			return u.jwtSecret, nil
		},
	)
	if err != nil {
		return 0, fmt.Errorf("parse jwt: %w", err)
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || !token.Valid {
		return 0, fmt.Errorf("invalid token claims")
	}

	var administratorID int64
	if _, err := fmt.Sscanf(claims.Subject, "%d", &administratorID); err != nil {
		return 0, fmt.Errorf("parse administrator id from token: %w", err)
	}

	return administratorID, nil
}
