package controllers

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type fakeTurnstile struct {
	calls  int
	token  string
	ip     string
	result error
}

func (f *fakeTurnstile) Verify(ctx context.Context, token, ip string) error {
	f.calls++
	f.token = token
	f.ip = ip
	return f.result
}

func TestLoginVerifiesTurnstileToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	logger := logrus.New()
	logger.SetOutput(io.Discard)
	verifier := &fakeTurnstile{result: errors.New("turnstile verification failed")}
	controller := NewAdminAuthController(nil, logger, verifier)

	recorder := httptest.NewRecorder()
	ginContext, _ := gin.CreateTestContext(recorder)
	ginContext.Request = httptest.NewRequest(http.MethodPost, "/api/admin/auth/login", bytes.NewBufferString(`{"identifier":"admin","password":"secret","turnstile_token":"tok-123"}`))
	ginContext.Request.Header.Set("Content-Type", "application/json")

	controller.Login(ginContext)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("login with invalid turnstile token: got %d, want %d", recorder.Code, http.StatusForbidden)
	}
	if verifier.calls != 1 {
		t.Fatalf("verifier called %d times, want 1", verifier.calls)
	}
	if verifier.token != "tok-123" {
		t.Errorf("verifier received token %q, want tok-123", verifier.token)
	}
	if verifier.ip == "" {
		t.Error("verifier did not receive client IP")
	}
}

func TestLoginProceedsWhenTurnstileDisabled(t *testing.T) {
	gin.SetMode(gin.TestMode)
	logger := logrus.New()
	logger.SetOutput(io.Discard)
	verifier := &fakeTurnstile{}
	controller := NewAdminAuthController(nil, logger, nil)

	recorder := httptest.NewRecorder()
	ginContext, _ := gin.CreateTestContext(recorder)
	ginContext.Request = httptest.NewRequest(http.MethodPost, "/api/admin/auth/login", nil)
	ginContext.Request.Header.Set("Content-Type", "application/json")

	controller.Login(ginContext)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("login without body with turnstile disabled: got %d, want %d", recorder.Code, http.StatusBadRequest)
	}
	if verifier.calls != 0 {
		t.Fatalf("verifier called %d times with turnstile disabled, want 0", verifier.calls)
	}
}
