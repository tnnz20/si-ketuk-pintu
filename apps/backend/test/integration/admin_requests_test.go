package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

func seedAdmin(t *testing.T) {
	t.Helper()
	seedUsecase := usecase.NewSeedAdministratorUsecase(repository.NewAdministratorRepository(appDB, bootstrap.Logger))
	input := usecase.SeedAdministratorInput{
		Username: "admin_test",
		Email:    "admin_test@example.com",
		Password: "password123",
	}
	err := seedUsecase.Seed(context.Background(), input)
	if err != nil && !errors.Is(err, repository.ErrAdministratorExists) {
		t.Fatalf("seed admin: %v", err)
	}
}

func getAdminToken(t *testing.T) string {
	t.Helper()
	seedAdmin(t)

	requestBody, _ := json.Marshal(model.LoginRequest{
		Identifier: "admin_test",
		Password:   "password123",
	})
	request := httptest.NewRequest(http.MethodPost, "/api/admin/auth/login", bytes.NewReader(requestBody))
	request.Header.Set("Content-Type", "application/json")

	recorder := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("failed to login: %d %s", recorder.Code, recorder.Body.String())
	}

	var response model.LoginResponse
	_ = json.Unmarshal(recorder.Body.Bytes(), &response)
	return response.Token
}

func TestAdminLoginSuccess(t *testing.T) {
	clearDatabase(t)
	seedAdmin(t)

	requestBody, _ := json.Marshal(model.LoginRequest{
		Identifier: "admin_test",
		Password:   "password123",
	})
	request := httptest.NewRequest(http.MethodPost, "/api/admin/auth/login", bytes.NewReader(requestBody))
	request.Header.Set("Content-Type", "application/json")

	recorder := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", recorder.Code)
	}
}

func TestAdminLoginFailed(t *testing.T) {
	clearDatabase(t)
	seedAdmin(t)

	requestBody, _ := json.Marshal(model.LoginRequest{
		Identifier: "admin_test",
		Password:   "wrongpassword",
	})
	request := httptest.NewRequest(http.MethodPost, "/api/admin/auth/login", bytes.NewReader(requestBody))
	request.Header.Set("Content-Type", "application/json")

	recorder := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized, got %d", recorder.Code)
	}
}

func TestAdminListRequests(t *testing.T) {
	clearDatabase(t)
	token := getAdminToken(t)

	request := httptest.NewRequest(http.MethodGet, "/api/admin/requests", nil)
	request.Header.Set("Authorization", "Bearer "+token)

	recorder := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", recorder.Code)
	}

	var response model.VisitRequestListResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if response.Total != 0 {
		t.Errorf("expected 0 total requests, got %d", response.Total)
	}
}

func TestAdminGetRequestAndStatusUpdate(t *testing.T) {
	clearDatabase(t)
	token := getAdminToken(t)

	// Create a request first
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	_ = writer.WriteField("email", "qr@example.com")
	_ = writer.WriteField("nama_instansi", "PT Testing")
	_ = writer.WriteField("alamat_instansi", "Jl. Test 123")
	_ = writer.WriteField("tanggal_kunjungan", "2030-01-01")
	_ = writer.WriteField("jam_kunjungan", "10:00")
	_ = writer.WriteField("tema_kunjungan", "Studi Banding")
	_ = writer.WriteField("pimpinan_rombongan", "Budi")
	_ = writer.WriteField("jumlah_tamu", "1")
	_ = writer.WriteField("kontak_dihubungi", "08123456789")
	_ = writer.WriteField("guests", `[{"nama": "Budi", "jabatan": "Manager"}]`)

	suratKunjungan, _ := writer.CreateFormFile("surat_kunjungan", "surat_kunjungan.pdf")
	_, _ = suratKunjungan.Write([]byte("%PDF-1.4 dummy pdf content"))
	suratTugas, _ := writer.CreateFormFile("surat_tugas", "surat_tugas.pdf")
	_, _ = suratTugas.Write([]byte("%PDF-1.4 dummy pdf content"))
	writer.Close()

	createReq := httptest.NewRequest(http.MethodPost, "/api/public/requests", &body)
	createReq.Header.Set("Content-Type", writer.FormDataContentType())
	createRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(createRec, createReq)

	var publicResp model.CreateVisitRequestResponse
	_ = json.Unmarshal(createRec.Body.Bytes(), &publicResp)

	// Find the created request ID using public endpoint
	verifyReq := httptest.NewRequest(http.MethodGet, "/api/public/requests/"+publicResp.Token, nil)
	verifyRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(verifyRec, verifyReq)

	var visitRequest model.VisitRequestResponse
	_ = json.Unmarshal(verifyRec.Body.Bytes(), &visitRequest)

	vrID := visitRequest.ID

	// Test GET /admin/requests/:id
	getReq := httptest.NewRequest(http.MethodGet, "/api/admin/requests/"+vrID, nil)
	getReq.Header.Set("Authorization", "Bearer "+token)
	getRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(getRec, getReq)

	if getRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for GET request, got %d", getRec.Code)
	}

	// Test PATCH /admin/requests/:id/status
	updateBody, _ := json.Marshal(model.UpdateStatusRequest{Status: "approved"})
	patchReq := httptest.NewRequest(http.MethodPatch, "/api/admin/requests/"+vrID+"/status", bytes.NewReader(updateBody))
	patchReq.Header.Set("Content-Type", "application/json")
	patchReq.Header.Set("Authorization", "Bearer "+token)
	patchRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(patchRec, patchReq)

	if patchRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for PATCH request, got %d", patchRec.Code)
	}

	// Verify status was updated
	getReq2 := httptest.NewRequest(http.MethodGet, "/api/admin/requests/"+vrID, nil)
	getReq2.Header.Set("Authorization", "Bearer "+token)
	getRec2 := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(getRec2, getReq2)

	var adminResp map[string]interface{}
	_ = json.Unmarshal(getRec2.Body.Bytes(), &adminResp)

	requestObj := adminResp["request"].(map[string]interface{})
	if requestObj["status"] != "approved" {
		t.Fatalf("expected status approved, got %v", requestObj["status"])
	}
}

func TestAdminUnauthorizedAccess(t *testing.T) {
	clearDatabase(t)

	request := httptest.NewRequest(http.MethodGet, "/api/admin/requests", nil)
	recorder := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized, got %d", recorder.Code)
	}
}
