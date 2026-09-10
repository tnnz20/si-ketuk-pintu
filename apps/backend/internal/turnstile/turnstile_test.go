package turnstile

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestVerifySendsSecretAndToken(t *testing.T) {
	t.Parallel()

	var gotSecret, gotToken, gotIP, gotContentType string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if err := r.ParseForm(); err != nil {
			t.Fatalf("parse form: %v", err)
		}
		gotSecret = r.PostFormValue("secret")
		gotToken = r.PostFormValue("response")
		gotIP = r.PostFormValue("remoteip")
		gotContentType = r.Header.Get("Content-Type")
		w.Header().Set("Content-Type", "application/json")
		if _, err := w.Write([]byte(`{"success": true}`)); err != nil {
			t.Errorf("write response: %v", err)
		}
	}))
	defer server.Close()

	verifier := &Verifier{secret: "test-secret", endpoint: server.URL, client: server.Client()}
	if err := verifier.Verify(context.Background(), "tok-123", "192.0.2.1"); err != nil {
		t.Fatalf("Verify: %v", err)
	}
	if gotSecret != "test-secret" {
		t.Errorf("secret = %q, want test-secret", gotSecret)
	}
	if gotToken != "tok-123" {
		t.Errorf("response = %q, want tok-123", gotToken)
	}
	if gotIP != "192.0.2.1" {
		t.Errorf("remoteip = %q, want 192.0.2.1", gotIP)
	}
	if gotContentType != "application/x-www-form-urlencoded" {
		t.Errorf("content type = %q", gotContentType)
	}
}

func TestVerifyRejectsUnsuccessfulResponse(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"success": false, "error-codes": ["timeout-or-duplicate"]}`))
	}))
	defer server.Close()

	verifier := &Verifier{secret: "test-secret", endpoint: server.URL, client: server.Client()}
	if err := verifier.Verify(context.Background(), "tok-123", ""); err == nil {
		t.Fatal("expected error for unsuccessful turnstile response")
	}
}

func TestVerifyRejectsEmptyTokenWithoutHTTPCall(t *testing.T) {
	t.Parallel()

	called := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		called = true
		w.WriteHeader(http.StatusBadRequest)
	}))
	defer server.Close()

	verifier := &Verifier{secret: "test-secret", endpoint: server.URL, client: server.Client()}
	if err := verifier.Verify(context.Background(), "  ", ""); err == nil {
		t.Fatal("expected error for empty token")
	}
	if called {
		t.Error("siteverify endpoint should not be called for empty token")
	}
}

func TestVerifyFailsOnHTTPError(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
	}))
	defer server.Close()

	verifier := &Verifier{secret: "test-secret", endpoint: server.URL, client: server.Client()}
	if err := verifier.Verify(context.Background(), "tok-123", ""); err == nil {
		t.Fatal("expected error when siteverify request fails")
	}
}
