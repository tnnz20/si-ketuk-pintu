package middleware

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func TestRequestLogger_LogLevels(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name          string
		statusCode    int
		withError     bool
		expectedLevel string
		expectedMsg   string
	}{
		{
			name:          "200 OK logs at info",
			statusCode:    http.StatusOK,
			expectedLevel: "info",
			expectedMsg:   "request completed",
		},
		{
			name:          "201 Created logs at info",
			statusCode:    http.StatusCreated,
			expectedLevel: "info",
			expectedMsg:   "request completed",
		},
		{
			name:          "400 Bad Request logs at warn",
			statusCode:    http.StatusBadRequest,
			expectedLevel: "warning",
			expectedMsg:   "request completed with client error",
		},
		{
			name:          "404 Not Found logs at warn",
			statusCode:    http.StatusNotFound,
			expectedLevel: "warning",
			expectedMsg:   "request completed with client error",
		},
		{
			name:          "500 Internal Error logs at error",
			statusCode:    http.StatusInternalServerError,
			expectedLevel: "error",
			expectedMsg:   "request failed",
		},
		{
			name:          "200 with gin context errors logs at error",
			statusCode:    http.StatusOK,
			withError:     true,
			expectedLevel: "error",
			expectedMsg:   "request failed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			buf := &bytes.Buffer{}
			logger := logrus.New()
			logger.SetOutput(buf)
			logger.SetFormatter(&logrus.JSONFormatter{})
			logger.SetLevel(logrus.DebugLevel)

			r := gin.New()
			r.Use(RequestLogger(logger))
			r.GET("/test", func(c *gin.Context) {
				if tt.withError {
					_ = c.Error(errors.New("simulated internal error"))
				}
				c.Status(tt.statusCode)
			})

			req := httptest.NewRequest(http.MethodGet, "/test?query=param", nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			var entry map[string]interface{}
			if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
				t.Fatalf("failed to parse log output: %v, raw: %s", err, buf.String())
			}

			if entry["level"] != tt.expectedLevel {
				t.Errorf("expected log level %q, got %q", tt.expectedLevel, entry["level"])
			}
			if entry["msg"] != tt.expectedMsg {
				t.Errorf("expected msg %q, got %q", tt.expectedMsg, entry["msg"])
			}
			if entry["component"] != "http" {
				t.Errorf("expected component 'http', got %v", entry["component"])
			}
			if entry["path"] != "/test?query=param" {
				t.Errorf("expected path '/test?query=param', got %v", entry["path"])
			}
		})
	}
}
