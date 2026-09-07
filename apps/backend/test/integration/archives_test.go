package integration

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
)

var pngTestBytes = []byte{0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0x00}

func createVisitRequest(t *testing.T) string {
	t.Helper()

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	_ = writer.WriteField("email", "archive@example.com")
	_ = writer.WriteField("nama_instansi", "PT Arsip")
	_ = writer.WriteField("alamat_instansi", "Jl. Arsip 1")
	_ = writer.WriteField("tanggal_kunjungan", epochDateMillis("2030-01-01"))
	_ = writer.WriteField("jam_kunjungan", epochTimeMillis("10:00"))
	_ = writer.WriteField("tema_kunjungan", "Kunjungan Arsip")
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

	if createRec.Code != http.StatusCreated {
		t.Fatalf("create visit request: got %d %s", createRec.Code, createRec.Body.String())
	}

	var createResp model.CreateVisitRequestResponse
	_ = json.Unmarshal(createRec.Body.Bytes(), &createResp)

	verifyReq := httptest.NewRequest(http.MethodGet, "/api/public/requests/"+createResp.Token, nil)
	verifyRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(verifyRec, verifyReq)

	var visitRequest model.VisitRequestResponse
	_ = json.Unmarshal(verifyRec.Body.Bytes(), &visitRequest)

	return visitRequest.ID
}

func approveRequest(t *testing.T, adminToken, requestID string) {
	t.Helper()

	updateBody, _ := json.Marshal(model.UpdateStatusRequest{Status: "approved"})
	patchReq := httptest.NewRequest(http.MethodPatch, "/api/admin/requests/"+requestID+"/status", bytes.NewReader(updateBody))
	patchReq.Header.Set("Content-Type", "application/json")
	patchReq.Header.Set("Authorization", "Bearer "+adminToken)
	patchRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(patchRec, patchReq)

	if patchRec.Code != http.StatusOK {
		t.Fatalf("approve request: got %d %s", patchRec.Code, patchRec.Body.String())
	}
}

func TestAdminArchivesListOnlyApproved(t *testing.T) {
	clearDatabase(t)
	adminToken := getAdminToken(t)

	pendingID := createVisitRequest(t)
	approvedID := createVisitRequest(t)
	approveRequest(t, adminToken, approvedID)
	rejectedID := createVisitRequest(t)

	updateBody, _ := json.Marshal(model.UpdateStatusRequest{Status: "rejected"})
	rejectReq := httptest.NewRequest(http.MethodPatch, "/api/admin/requests/"+rejectedID+"/status", bytes.NewReader(updateBody))
	rejectReq.Header.Set("Content-Type", "application/json")
	rejectReq.Header.Set("Authorization", "Bearer "+adminToken)
	rejectRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(rejectRec, rejectReq)
	if rejectRec.Code != http.StatusOK {
		t.Fatalf("reject request: got %d", rejectRec.Code)
	}
	_ = pendingID

	listReq := httptest.NewRequest(http.MethodGet, "/api/admin/archives", nil)
	listReq.Header.Set("Authorization", "Bearer "+adminToken)
	listRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(listRec, listReq)

	if listRec.Code != http.StatusOK {
		t.Fatalf("list archives: got %d %s", listRec.Code, listRec.Body.String())
	}

	var response model.VisitRequestListResponse
	if err := json.Unmarshal(listRec.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if response.Total != 1 || len(response.Data) != 1 {
		t.Fatalf("expected exactly 1 archive, got total=%d data=%d", response.Total, len(response.Data))
	}
	if response.Data[0].Status != "approved" || response.Data[0].ID != approvedID {
		t.Fatalf("expected only the approved request %s, got %+v", approvedID, response.Data[0])
	}
}

func TestAdminArchiveDocumentationsUploadDeleteDownload(t *testing.T) {
	clearDatabase(t)
	adminToken := getAdminToken(t)
	requestID := createVisitRequest(t)

	// Upload before approval must be rejected
	unauthBody := &bytes.Buffer{}
	unauthWriter := multipart.NewWriter(unauthBody)
	part, _ := unauthWriter.CreateFormFile("files", "a.png")
	_, _ = part.Write(pngTestBytes)
	unauthWriter.Close()

	unauthReq := httptest.NewRequest(http.MethodPost, "/api/admin/archives/"+requestID+"/documentations", unauthBody)
	unauthReq.Header.Set("Content-Type", unauthWriter.FormDataContentType())
	unauthReq.Header.Set("Authorization", "Bearer "+adminToken)
	unauthRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(unauthRec, unauthReq)

	if unauthRec.Code != http.StatusConflict {
		t.Fatalf("upload on pending request: got %d %s, want 409", unauthRec.Code, unauthRec.Body.String())
	}

	approveRequest(t, adminToken, requestID)

	// Successful multi-image upload
	uploadBody := &bytes.Buffer{}
	uploadWriter := multipart.NewWriter(uploadBody)
	for _, name := range []string{"foto-a.png", "foto-b.png"} {
		part, _ := uploadWriter.CreateFormFile("files", name)
		_, _ = part.Write(pngTestBytes)
	}
	uploadWriter.Close()

	uploadReq := httptest.NewRequest(http.MethodPost, "/api/admin/archives/"+requestID+"/documentations", uploadBody)
	uploadReq.Header.Set("Content-Type", uploadWriter.FormDataContentType())
	uploadReq.Header.Set("Authorization", "Bearer "+adminToken)
	uploadRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(uploadRec, uploadReq)

	if uploadRec.Code != http.StatusCreated {
		t.Fatalf("upload documentations: got %d %s", uploadRec.Code, uploadRec.Body.String())
	}

	var uploadResp struct {
		Attachments []model.AttachmentResponse `json:"attachments"`
	}
	if err := json.Unmarshal(uploadRec.Body.Bytes(), &uploadResp); err != nil {
		t.Fatalf("unmarshal upload response: %v", err)
	}
	if len(uploadResp.Attachments) != 2 {
		t.Fatalf("expected 2 attachments, got %d", len(uploadResp.Attachments))
	}
	for _, attachment := range uploadResp.Attachments {
		if attachment.AttachmentType != "images" || attachment.ID == 0 {
			t.Fatalf("unexpected attachment metadata: %+v", attachment)
		}
	}

	// Multiple images rows per request are allowed
	detailReq := httptest.NewRequest(http.MethodGet, "/api/admin/requests/"+requestID, nil)
	detailReq.Header.Set("Authorization", "Bearer "+adminToken)
	detailRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(detailRec, detailReq)

	var detail struct {
		Request model.VisitRequestResponse `json:"request"`
	}
	_ = json.Unmarshal(detailRec.Body.Bytes(), &detail)
	imageCount := 0
	for _, attachment := range detail.Request.Attachments {
		if attachment.AttachmentType == "images" {
			imageCount++
		}
	}
	if imageCount != 2 {
		t.Fatalf("expected 2 images rows on detail, got %d", imageCount)
	}

	// Invalid extension rejected
	badBody := &bytes.Buffer{}
	badWriter := multipart.NewWriter(badBody)
	badPart, _ := badWriter.CreateFormFile("files", "not-an-image.pdf")
	_, _ = badPart.Write([]byte("%PDF-1.4 fake"))
	badWriter.Close()

	badReq := httptest.NewRequest(http.MethodPost, "/api/admin/archives/"+requestID+"/documentations", badBody)
	badReq.Header.Set("Content-Type", badWriter.FormDataContentType())
	badReq.Header.Set("Authorization", "Bearer "+adminToken)
	badRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(badRec, badReq)

	if badRec.Code != http.StatusBadRequest {
		t.Fatalf("upload invalid extension: got %d %s, want 400", badRec.Code, badRec.Body.String())
	}

	// Download first image
	first := uploadResp.Attachments[0]
	downloadPath := "/api/admin/archives/" + requestID + "/attachments/images/" + strconv.FormatInt(first.ID, 10)
	downloadReq := httptest.NewRequest(http.MethodGet, downloadPath, nil)
	downloadReq.Header.Set("Authorization", "Bearer "+adminToken)
	downloadRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(downloadRec, downloadReq)

	if downloadRec.Code != http.StatusOK {
		t.Fatalf("download image: got %d %s", downloadRec.Code, downloadRec.Body.String())
	}
	if got := downloadRec.Header().Get("Content-Type"); got != "image/png" {
		t.Fatalf("download content type = %q, want image/png", got)
	}
	if !bytes.Equal(downloadRec.Body.Bytes(), pngTestBytes) {
		t.Fatal("downloaded bytes do not match uploaded image")
	}

	// Delete one documentation image
	deleteReq := httptest.NewRequest(http.MethodDelete, "/api/admin/archives/"+requestID+"/documentations/"+strconv.FormatInt(first.ID, 10), nil)
	deleteReq.Header.Set("Authorization", "Bearer "+adminToken)
	deleteRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(deleteRec, deleteReq)

	if deleteRec.Code != http.StatusOK {
		t.Fatalf("delete documentation: got %d %s", deleteRec.Code, deleteRec.Body.String())
	}

	// Deleting it again is 404
	deleteAgain := httptest.NewRequest(http.MethodDelete, "/api/admin/archives/"+requestID+"/documentations/"+strconv.FormatInt(first.ID, 10), nil)
	deleteAgain.Header.Set("Authorization", "Bearer "+adminToken)
	deleteAgainRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(deleteAgainRec, deleteAgain)

	if deleteAgainRec.Code != http.StatusNotFound {
		t.Fatalf("delete missing documentation: got %d, want 404", deleteAgainRec.Code)
	}

	// Download after deletion is 404
	downloadGone := httptest.NewRequest(http.MethodGet, downloadPath, nil)
	downloadGone.Header.Set("Authorization", "Bearer "+adminToken)
	downloadGoneRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(downloadGoneRec, downloadGone)

	if downloadGoneRec.Code != http.StatusNotFound {
		t.Fatalf("download deleted image: got %d, want 404", downloadGoneRec.Code)
	}
}

func TestAdminArchiveDaftarAbsenRules(t *testing.T) {
	clearDatabase(t)
	adminToken := getAdminToken(t)
	requestID := createVisitRequest(t)
	approveRequest(t, adminToken, requestID)

	uploadPDF := func(filename string, content []byte) *httptest.ResponseRecorder {
		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)
		part, _ := writer.CreateFormFile("file", filename)
		_, _ = part.Write(content)
		writer.Close()

		req := httptest.NewRequest(http.MethodPost, "/api/admin/archives/"+requestID+"/daftar-absen", body)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rec := httptest.NewRecorder()
		bootstrap.Router.ServeHTTP(rec, req)
		return rec
	}

	nonPDF := uploadPDF("absen.png", pngTestBytes)
	if nonPDF.Code != http.StatusBadRequest {
		t.Fatalf("upload non-pdf daftar absen: got %d %s, want 400", nonPDF.Code, nonPDF.Body.String())
	}

	valid := uploadPDF("daftar_absen.pdf", []byte("%PDF-1.4 daftar absen"))
	if valid.Code != http.StatusCreated {
		t.Fatalf("upload daftar absen: got %d %s", valid.Code, valid.Body.String())
	}

	var uploadResp struct {
		Attachment model.AttachmentResponse `json:"attachment"`
	}
	if err := json.Unmarshal(valid.Body.Bytes(), &uploadResp); err != nil {
		t.Fatalf("unmarshal upload response: %v", err)
	}
	if uploadResp.Attachment.AttachmentType != "daftar_absen" {
		t.Fatalf("type = %q, want daftar_absen", uploadResp.Attachment.AttachmentType)
	}

	duplicate := uploadPDF("daftar_absen.pdf", []byte("%PDF-1.4 another"))
	if duplicate.Code != http.StatusConflict {
		t.Fatalf("duplicate daftar absen: got %d %s, want 409", duplicate.Code, duplicate.Body.String())
	}

	downloadReq := httptest.NewRequest(
		http.MethodGet,
		"/api/admin/archives/"+requestID+"/attachments/daftar_absen/"+strconv.FormatInt(uploadResp.Attachment.ID, 10),
		nil,
	)
	downloadReq.Header.Set("Authorization", "Bearer "+adminToken)
	downloadRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(downloadRec, downloadReq)

	if downloadRec.Code != http.StatusOK {
		t.Fatalf("download daftar absen: got %d", downloadRec.Code)
	}
	if got := downloadRec.Header().Get("Content-Type"); got != "application/pdf" {
		t.Fatalf("content type = %q, want application/pdf", got)
	}

	deleteReq := httptest.NewRequest(http.MethodDelete, "/api/admin/archives/"+requestID+"/daftar-absen", nil)
	deleteReq.Header.Set("Authorization", "Bearer "+adminToken)
	deleteRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(deleteRec, deleteReq)

	if deleteRec.Code != http.StatusOK {
		t.Fatalf("delete daftar absen: got %d %s", deleteRec.Code, deleteRec.Body.String())
	}

	deleteAgain := httptest.NewRequest(http.MethodDelete, "/api/admin/archives/"+requestID+"/daftar-absen", nil)
	deleteAgain.Header.Set("Authorization", "Bearer "+adminToken)
	deleteAgainRec := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(deleteAgainRec, deleteAgain)

	if deleteAgainRec.Code != http.StatusNotFound {
		t.Fatalf("delete missing daftar absen: got %d, want 404", deleteAgainRec.Code)
	}
}

func TestAdminArchiveUnauthorizedAccess(t *testing.T) {
	clearDatabase(t)

	request := httptest.NewRequest(http.MethodGet, "/api/admin/archives", nil)
	recorder := httptest.NewRecorder()
	bootstrap.Router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized, got %d", recorder.Code)
	}
}
