package integration

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
)

func TestCreateVisitRequestSuccess(t *testing.T) {
	clearDatabase(t)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	_ = writer.WriteField("email", "test@example.com")
	_ = writer.WriteField("nama_instansi", "PT Testing")
	_ = writer.WriteField("alamat_instansi", "Jl. Test 123")
	_ = writer.WriteField("tanggal_kunjungan", epochDateMillis("2030-01-01"))
	_ = writer.WriteField("jam_kunjungan", epochTimeMillis("10:00"))
	_ = writer.WriteField("tema_kunjungan", "Studi Banding")
	_ = writer.WriteField("pimpinan_rombongan", "Budi")
	_ = writer.WriteField("jumlah_tamu", "1")
	_ = writer.WriteField("kontak_dihubungi", "08123456789")
	_ = writer.WriteField("guests", `[{"nama": "Budi", "jabatan": "Manager"}]`)

	// Create dummy PDF files
	suratKunjungan, _ := writer.CreateFormFile("surat_kunjungan", "surat_kunjungan.pdf")
	_, _ = suratKunjungan.Write([]byte("%PDF-1.4 dummy pdf content"))

	suratTugas, _ := writer.CreateFormFile("surat_tugas", "surat_tugas.pdf")
	_, _ = suratTugas.Write([]byte("%PDF-1.4 dummy pdf content"))

	writer.Close()

	request := httptest.NewRequest(http.MethodPost, "/api/public/requests", &body)
	request.Header.Set("Content-Type", writer.FormDataContentType())

	recorder := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d. body: %s", recorder.Code, recorder.Body.String())
	}

	var response model.CreateVisitRequestResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if response.Token == "" {
		t.Errorf("expected token, got empty string")
	}

	// Verify we can retrieve it
	verifyRequest := httptest.NewRequest(http.MethodGet, "/api/public/requests/"+response.Token, nil)
	verifyRecorder := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(verifyRecorder, verifyRequest)

	if verifyRecorder.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", verifyRecorder.Code)
	}

	var visitRequest model.VisitRequestResponse
	if err := json.Unmarshal(verifyRecorder.Body.Bytes(), &visitRequest); err != nil {
		t.Fatalf("unmarshal visit request: %v", err)
	}

	if visitRequest.Email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %s", visitRequest.Email)
	}
}

func TestGetVisitRequestIncludesAuditEventsNewestFirst(t *testing.T) {
	clearDatabase(t)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	_ = writer.WriteField("email", "audit@example.com")
	_ = writer.WriteField("nama_instansi", "PT Audit")
	_ = writer.WriteField("alamat_instansi", "Jl. Audit 1")
	_ = writer.WriteField("tanggal_kunjungan", epochDateMillis("2030-01-01"))
	_ = writer.WriteField("jam_kunjungan", epochTimeMillis("10:00"))
	_ = writer.WriteField("tema_kunjungan", "Audit")
	_ = writer.WriteField("pimpinan_rombongan", "Budi")
	_ = writer.WriteField("jumlah_tamu", "1")
	_ = writer.WriteField("kontak_dihubungi", "08123456789")
	_ = writer.WriteField("guests", `[{"nama": "Budi", "jabatan": "Manager"}]`)

	suratKunjungan, _ := writer.CreateFormFile("surat_kunjungan", "surat_kunjungan.pdf")
	_, _ = suratKunjungan.Write([]byte("%PDF-1.4 dummy pdf content"))
	suratTugas, _ := writer.CreateFormFile("surat_tugas", "surat_tugas.pdf")
	_, _ = suratTugas.Write([]byte("%PDF-1.4 dummy pdf content"))
	writer.Close()

	createRequest := httptest.NewRequest(http.MethodPost, "/api/public/requests", &body)
	createRequest.Header.Set("Content-Type", writer.FormDataContentType())
	createRecorder := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(createRecorder, createRequest)

	if createRecorder.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d. body: %s", createRecorder.Code, createRecorder.Body.String())
	}

	var createResponse model.CreateVisitRequestResponse
	if err := json.Unmarshal(createRecorder.Body.Bytes(), &createResponse); err != nil {
		t.Fatalf("unmarshal create response: %v", err)
	}

	var visitRequest model.VisitRequestResponse
	getRequest := httptest.NewRequest(http.MethodGet, "/api/public/requests/"+createResponse.Token, nil)
	getRecorder := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(getRecorder, getRequest)
	if err := json.Unmarshal(getRecorder.Body.Bytes(), &visitRequest); err != nil {
		t.Fatalf("unmarshal visit request: %v", err)
	}

	occurredAt := time.Now().UnixMilli()
	for _, event := range []struct {
		action     string
		occurredAt int64
	}{
		{action: "older_event", occurredAt: occurredAt - 1000},
		{action: "newer_event", occurredAt: occurredAt},
	} {
		result := appDB.Exec(
			`INSERT INTO audit_events (visit_request_id, actor_type, action, previous_value, new_value, occurred_at)
			 VALUES (?, ?, ?, '{}'::jsonb, '{}'::jsonb, ?)`,
			visitRequest.ID,
			"system",
			event.action,
			event.occurredAt,
		)
		if result.Error != nil {
			t.Fatalf("insert audit event: %v", result.Error)
		}
	}

	getRecorder = httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(getRecorder, getRequest)
	var response struct {
		AuditEvents []model.AuditEventResponse `json:"audit_events"`
	}
	if err := json.Unmarshal(getRecorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal public response: %v", err)
	}

	newerIndex := -1
	olderIndex := -1
	for index, event := range response.AuditEvents {
		switch event.Action {
		case "newer_event":
			newerIndex = index
		case "older_event":
			olderIndex = index
		}
	}
	if newerIndex == -1 {
		t.Fatal("expected newer_event to be present")
	}
	if olderIndex == -1 {
		t.Fatal("expected older_event to be present")
	}
	if newerIndex >= olderIndex {
		t.Errorf("expected newer_event before older_event, got indexes %d and %d", newerIndex, olderIndex)
	}
}

func TestCreateVisitRequestValidationFailed(t *testing.T) {
	clearDatabase(t)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	// Missing required fields will trigger validation failure
	_ = writer.WriteField("email", "test@example.com")
	writer.Close()

	request := httptest.NewRequest(http.MethodPost, "/api/public/requests", &body)
	request.Header.Set("Content-Type", writer.FormDataContentType())

	recorder := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request, got %d. body: %s", recorder.Code, recorder.Body.String())
	}
}

func TestGetVisitRequestNotFound(t *testing.T) {
	clearDatabase(t)

	request := httptest.NewRequest(http.MethodGet, "/api/public/requests/NOT-FOUND-TOKEN", nil)
	recorder := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected 404 Not Found, got %d", recorder.Code)
	}
}

func TestDownloadQRNotFound(t *testing.T) {
	clearDatabase(t)

	request := httptest.NewRequest(http.MethodGet, "/api/public/requests/NOT-FOUND-TOKEN/qr", nil)
	recorder := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected 404 Not Found, got %d", recorder.Code)
	}
}

func TestDownloadQRSuccess(t *testing.T) {
	clearDatabase(t)

	// First create a request
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	_ = writer.WriteField("email", "qr@example.com")
	_ = writer.WriteField("nama_instansi", "PT Testing")
	_ = writer.WriteField("alamat_instansi", "Jl. Test 123")
	_ = writer.WriteField("tanggal_kunjungan", epochDateMillis("2030-01-01"))
	_ = writer.WriteField("jam_kunjungan", epochTimeMillis("10:00"))
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

	var response model.CreateVisitRequestResponse
	_ = json.Unmarshal(createRec.Body.Bytes(), &response)

	// Now download QR
	qrReq := httptest.NewRequest(http.MethodGet, "/api/public/requests/"+response.Token+"/qr", nil)
	qrRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(qrRec, qrReq)

	if qrRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", qrRec.Code)
	}

	contentType := qrRec.Header().Get("Content-Type")
	if contentType != "image/png" {
		t.Fatalf("expected content type image/png, got %s", contentType)
	}

	// Verify it's a non-empty image
	qrData, _ := io.ReadAll(qrRec.Body)
	if len(qrData) == 0 {
		t.Fatalf("expected non-empty qr code body")
	}
	if !strings.HasPrefix(string(qrData), "\x89PNG") {
		t.Fatalf("expected PNG signature")
	}
}

func TestCreateVisitRequestRejectsInvalidTemporalValues(t *testing.T) {
	clearDatabase(t)

	visitDate, err := time.ParseInLocation("2006-01-02", "2030-01-01", witaZone)
	if err != nil {
		t.Fatal(err)
	}
	validTanggal := strconv.FormatInt(visitDate.UnixMilli(), 10)
	validJam := epochTimeMillis("10:00")

	tests := []struct {
		name     string
		tanggal  string
		jam      string
		wantCode int
	}{
		{name: "zero tanggal", tanggal: "0", jam: validJam, wantCode: http.StatusBadRequest},
		{name: "negative tanggal", tanggal: "-100", jam: validJam, wantCode: http.StatusBadRequest},
		{name: "non-midnight tanggal", tanggal: "5", jam: validJam, wantCode: http.StatusBadRequest},
		{name: "tanggal overflow", tanggal: "99999999999999999999", jam: validJam, wantCode: http.StatusBadRequest},
		{name: "zero jam", tanggal: validTanggal, jam: "-1", wantCode: http.StatusBadRequest},
		{name: "non-minute-aligned jam", tanggal: validTanggal, jam: "1", wantCode: http.StatusBadRequest},
		{name: "jam over one day", tanggal: validTanggal, jam: "86400000", wantCode: http.StatusBadRequest},
		{name: "jam overflow", tanggal: validTanggal, jam: "99999999999999999999", wantCode: http.StatusBadRequest},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			var body bytes.Buffer
			writer := multipart.NewWriter(&body)
			_ = writer.WriteField("email", "invalid-temporal@example.com")
			_ = writer.WriteField("nama_instansi", "PT Testing")
			_ = writer.WriteField("alamat_instansi", "Jl. Test 123")
			_ = writer.WriteField("tanggal_kunjungan", test.tanggal)
			_ = writer.WriteField("jam_kunjungan", test.jam)
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

			request := httptest.NewRequest(http.MethodPost, "/api/public/requests", &body)
			request.Header.Set("Content-Type", writer.FormDataContentType())
			recorder := httptest.NewRecorder()
			bootstrap.Router.ServeHTTP(recorder, request)

			if recorder.Code != test.wantCode {
				t.Fatalf("got %d %s, want %d", recorder.Code, recorder.Body.String(), test.wantCode)
			}
		})
	}
}

func TestCreateVisitRequestRejectsPastVisit(t *testing.T) {
	clearDatabase(t)

	pastDate, err := time.ParseInLocation("2006-01-02", "2020-01-01", witaZone)
	if err != nil {
		t.Fatal(err)
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	_ = writer.WriteField("email", "past@example.com")
	_ = writer.WriteField("nama_instansi", "PT Testing")
	_ = writer.WriteField("alamat_instansi", "Jl. Test 123")
	_ = writer.WriteField("tanggal_kunjungan", strconv.FormatInt(pastDate.UnixMilli(), 10))
	_ = writer.WriteField("jam_kunjungan", epochTimeMillis("10:00"))
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

	request := httptest.NewRequest(http.MethodPost, "/api/public/requests", &body)
	request.Header.Set("Content-Type", writer.FormDataContentType())
	recorder := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("got %d %s, want %d", recorder.Code, recorder.Body.String(), http.StatusBadRequest)
	}
}
