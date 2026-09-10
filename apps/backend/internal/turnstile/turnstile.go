package turnstile

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const SiteVerifyEndpoint = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

type Verifier struct {
	secret   string
	endpoint string
	client   *http.Client
}

func NewVerifier(secret string) *Verifier {
	return &Verifier{
		secret:   secret,
		endpoint: SiteVerifyEndpoint,
		client:   &http.Client{Timeout: 10 * time.Second},
	}
}

type siteVerifyResponse struct {
	Success    bool     `json:"success"`
	ErrorCodes []string `json:"error-codes"`
}

func (v *Verifier) Verify(ctx context.Context, token, remoteIP string) error {
	if strings.TrimSpace(token) == "" {
		return errors.New("turnstile token missing")
	}

	form := url.Values{}
	form.Set("secret", v.secret)
	form.Set("response", token)
	if remoteIP != "" {
		form.Set("remoteip", remoteIP)
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, v.endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return errors.New("turnstile verification failed")
	}
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	response, err := v.client.Do(request)
	if err != nil {
		return errors.New("turnstile verification failed")
	}
	defer response.Body.Close()

	var payload siteVerifyResponse
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return errors.New("turnstile verification failed")
	}
	if !payload.Success {
		return errors.New("turnstile verification failed")
	}

	return nil
}
