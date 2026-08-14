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
		"GET /admin/requests/:id":                      false,
		"PATCH /admin/requests/:id/status":             false,
		"GET /admin/requests/:id/attachments/:type": false,
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
