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
		"GET /healthz":                                 false,
		"GET /readyz":                                  false,
		"POST /public/requests":                        false,
		"GET /public/requests/:token":                  false,
		"GET /public/requests/:token/qr":               false,
		"POST /admin/auth/login":                       false,
		"GET /admin/requests":                          false,
		"GET /admin/requests/graph":                    false,
		"GET /admin/requests/:id":                      false,
		"PATCH /admin/requests/:id/status":             false,
		"GET /admin/requests/:id/attachments/:type": false,
		"GET /admin/archives":                                       false,
		"POST /admin/archives/:id/documentations":                   false,
		"DELETE /admin/archives/:id/documentations/:attachment_id":  false,
		"POST /admin/archives/:id/daftar-absen":                     false,
		"DELETE /admin/archives/:id/daftar-absen":                   false,
		"GET /admin/archives/:id/attachments/:attachment_type/:attachment_id": false,
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
		{http.MethodGet, "/admin/archives"},
		{http.MethodPost, "/admin/archives/" + archiveID + "/documentations"},
		{http.MethodDelete, "/admin/archives/" + archiveID + "/documentations/1"},
		{http.MethodPost, "/admin/archives/" + archiveID + "/daftar-absen"},
		{http.MethodDelete, "/admin/archives/" + archiveID + "/daftar-absen"},
		{http.MethodGet, "/admin/archives/" + archiveID + "/attachments/images/1"},
	} {
		req, _ := http.NewRequest(test.method, test.path, nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, req)
		if recorder.Code != http.StatusUnauthorized {
			t.Errorf("%s %s without token: got %d, want %d", test.method, test.path, recorder.Code, http.StatusUnauthorized)
		}
	}

	for _, path := range []string{"/admin/requests/graph", "/admin/requests/00000000-0000-0000-0000-000000000001"} {
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

	req, _ := http.NewRequest(http.MethodOptions, "/healthz", nil)
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
