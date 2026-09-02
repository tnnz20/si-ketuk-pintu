package route

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/delivery/http/controllers"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/delivery/http/middleware"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

func TestRouterRegistersAllRoutes(t *testing.T) {
	t.Parallel()

	logger := logrus.New()
	logger.SetOutput(io.Discard) // Discard logs during tests

	deps := RouterDeps{
		Logger:                 logger,
		CORSOrigins:            []string{"*"},
		RateLimiter:            middleware.NewRateLimiter(10.0, 10),
		AuthUsecase:            usecase.NewAuthUsecase(nil, "secret", 24, logger),
		HealthController:       &controllers.HealthController{},
		VisitRequestController: &controllers.VisitRequestController{},
		AdminAuthController:    &controllers.AdminAuthController{},
		AdminRequestController: &controllers.AdminRequestController{},
	}

	router := NewRouter(deps)
	routes := router.Routes()

	expectedRoutes := map[string]bool{
		"GET /api/healthz":                                                        false,
		"GET /api/readyz":                                                         false,
		"POST /api/public/requests":                                               false,
		"GET /api/public/requests/:token":                                         false,
		"GET /api/public/requests/:token/qr":                                      false,
		"POST /api/admin/auth/login":                                              false,
		"GET /api/admin/requests":                                                 false,
		"GET /api/admin/requests/graph":                                           false,
		"GET /api/admin/requests/:id":                                             false,
		"PATCH /api/admin/requests/:id/status":                                    false,
		"GET /api/admin/requests/:id/attachments/:type":                           false,
		"GET /api/admin/archives":                                                 false,
		"POST /api/admin/archives/:id/documentations":                             false,
		"DELETE /api/admin/archives/:id/documentations/:attachment_id":            false,
		"POST /api/admin/archives/:id/daftar-absen":                               false,
		"DELETE /api/admin/archives/:id/daftar-absen":                             false,
		"GET /api/admin/archives/:id/attachments/:attachment_type/:attachment_id": false,
	}

	for _, route := range routes {
		key := fmt.Sprintf("%s %s", route.Method, route.Path)
		if _, exists := expectedRoutes[key]; exists {
			expectedRoutes[key] = true
		}
	}

	for route, found := range expectedRoutes {
		if !found {
			t.Errorf("expected route %q was not registered", route)
		}
	}
}

func TestRouterGraphRouteRequiresAuth(t *testing.T) {
	t.Parallel()

	logger := logrus.New()
	logger.SetOutput(io.Discard)

	deps := RouterDeps{
		Logger:                 logger,
		CORSOrigins:            []string{"*"},
		RateLimiter:            middleware.NewRateLimiter(10.0, 10),
		AuthUsecase:            usecase.NewAuthUsecase(nil, "secret", 24, logger),
		HealthController:       &controllers.HealthController{},
		VisitRequestController: &controllers.VisitRequestController{},
		AdminAuthController:    &controllers.AdminAuthController{},
		AdminRequestController: &controllers.AdminRequestController{},
	}
	router := NewRouter(deps)

	archiveID := "00000000-0000-0000-0000-000000000002"
	for _, test := range []struct {
		method, path string
	}{
		{http.MethodGet, "/api/admin/archives"},
		{http.MethodPost, "/api/admin/archives/" + archiveID + "/documentations"},
		{http.MethodDelete, "/api/admin/archives/" + archiveID + "/documentations/1"},
		{http.MethodPost, "/api/admin/archives/" + archiveID + "/daftar-absen"},
		{http.MethodDelete, "/api/admin/archives/" + archiveID + "/daftar-absen"},
		{http.MethodGet, "/api/admin/archives/" + archiveID + "/attachments/images/1"},
	} {
		req, _ := http.NewRequest(test.method, test.path, nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, req)
		if recorder.Code != http.StatusUnauthorized {
			t.Errorf("%s %s without token: got %d, want %d", test.method, test.path, recorder.Code, http.StatusUnauthorized)
		}
	}

	for _, path := range []string{"/api/admin/requests/graph", "/api/admin/requests/00000000-0000-0000-0000-000000000001"} {
		req, _ := http.NewRequest(http.MethodGet, path, nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, req)
		if recorder.Code != http.StatusUnauthorized {
			t.Errorf("GET %s without token: got %d, want %d", path, recorder.Code, http.StatusUnauthorized)
		}
	}
}

func TestRouterContainsRequiredMiddleware(t *testing.T) {
	t.Parallel()

	logger := logrus.New()
	logger.SetOutput(io.Discard)

	deps := RouterDeps{
		Logger:                 logger,
		CORSOrigins:            []string{"http://localhost:3000"},
		RateLimiter:            middleware.NewRateLimiter(10.0, 10),
		AuthUsecase:            usecase.NewAuthUsecase(nil, "secret", 24, logger),
		HealthController:       &controllers.HealthController{},
		VisitRequestController: &controllers.VisitRequestController{},
		AdminAuthController:    &controllers.AdminAuthController{},
		AdminRequestController: &controllers.AdminRequestController{},
	}

	router := NewRouter(deps)

	req, _ := http.NewRequest(http.MethodOptions, "/api/healthz", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "GET")

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusNoContent {
		t.Errorf("expected 204 No Content for OPTIONS, got %d", recorder.Code)
	}

	if recorder.Header().Get("Access-Control-Allow-Origin") != "http://localhost:3000" {
		t.Errorf("expected CORS header missing or incorrect")
	}
}
