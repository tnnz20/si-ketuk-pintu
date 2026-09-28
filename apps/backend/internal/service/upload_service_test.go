package service

import (
	"bytes"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
)

func TestFileSystemUploadService_SavePDF_Success(t *testing.T) {
	uploadDir := t.TempDir()
	svc := NewFileSystemUploadService(uploadDir)

	types := []string{
		"surat_kunjungan",
		"surat_tugas",
		"surat_persetujuan",
		"surat_reschedule",
		"daftar_absen",
	}

	for _, attachmentType := range types {
		t.Run(attachmentType, func(t *testing.T) {
			pdfContent := []byte("%PDF-1.4 sample pdf content")
			input := model.FileInput{
				Reader:   bytes.NewReader(pdfContent),
				Filename: "doc.pdf",
				Size:     int64(len(pdfContent)),
			}

			attachment, err := svc.SavePDF(attachmentType, input)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if attachment.AttachmentType != attachmentType {
				t.Errorf("attachmentType = %s, want %s", attachment.AttachmentType, attachmentType)
			}
			if attachment.ContentType != "application/pdf" {
				t.Errorf("contentType = %s, want application/pdf", attachment.ContentType)
			}
			if attachment.SizeBytes != int64(len(pdfContent)) {
				t.Errorf("size = %d, want %d", attachment.SizeBytes, len(pdfContent))
			}
			if attachment.ChecksumSHA256 == "" {
				t.Error("expected non-empty checksum")
			}

			fullPath := filepath.Join(uploadDir, filepath.FromSlash(attachment.StorageKey))
			if _, err := os.Stat(fullPath); err != nil {
				t.Errorf("saved file does not exist on disk: %v", err)
			}
		})
	}
}

func TestFileSystemUploadService_SavePDF_InvalidMIME(t *testing.T) {
	uploadDir := t.TempDir()
	svc := NewFileSystemUploadService(uploadDir)

	input := model.FileInput{
		Reader:   strings.NewReader("plain text not a pdf"),
		Filename: "fake.pdf",
		Size:     20,
	}

	_, err := svc.SavePDF("surat_kunjungan", input)
	if err == nil || !errors.Is(err, ErrInvalidPDF) {
		t.Fatalf("expected ErrInvalidPDF, got: %v", err)
	}
}

func TestFileSystemUploadService_SavePDF_Oversized(t *testing.T) {
	uploadDir := t.TempDir()
	svc := NewFileSystemUploadService(uploadDir)

	// Declared size over limit
	input := model.FileInput{
		Reader:   strings.NewReader("%PDF-1.4"),
		Filename: "big.pdf",
		Size:     MaxPDFSize + 1,
	}
	_, err := svc.SavePDF("surat_kunjungan", input)
	if err == nil || !strings.Contains(err.Error(), "exceeds 5 MB limit") {
		t.Fatalf("expected 5MB limit error, got: %v", err)
	}

	// Content over limit
	bigContent := append([]byte("%PDF-1.4"), bytes.Repeat([]byte("A"), MaxPDFSize+1)...)
	input2 := model.FileInput{
		Reader:   bytes.NewReader(bigContent),
		Filename: "big2.pdf",
		Size:     10, // falsely declared small
	}
	_, err2 := svc.SavePDF("surat_kunjungan", input2)
	if err2 == nil || !strings.Contains(err2.Error(), "exceeds 5 MB limit") {
		t.Fatalf("expected 5MB limit error for content, got: %v", err2)
	}
}

func TestFileSystemUploadService_SavePDF_UnsupportedType(t *testing.T) {
	uploadDir := t.TempDir()
	svc := NewFileSystemUploadService(uploadDir)

	input := model.FileInput{
		Reader:   strings.NewReader("%PDF-1.4"),
		Filename: "test.pdf",
		Size:     8,
	}

	_, err := svc.SavePDF("unknown_type", input)
	if err == nil || !strings.Contains(err.Error(), "unsupported attachment type") {
		t.Fatalf("expected unsupported type error, got: %v", err)
	}
}

func TestFileSystemUploadService_SaveImage_Success(t *testing.T) {
	uploadDir := t.TempDir()
	svc := NewFileSystemUploadService(uploadDir)

	// Valid PNG header: 89 50 4E 47 0D 0A 1A 0A
	pngBytes := []byte{0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n', 0, 0, 0, 0}
	inputPNG := model.FileInput{
		Reader:   bytes.NewReader(pngBytes),
		Filename: "photo.png",
		Size:     int64(len(pngBytes)),
	}

	attachment, err := svc.SaveImage("documentation", inputPNG)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if attachment.ContentType != "image/png" {
		t.Errorf("contentType = %s, want image/png", attachment.ContentType)
	}
	if !strings.HasSuffix(attachment.StorageKey, ".png") {
		t.Errorf("storageKey = %s, want .png suffix", attachment.StorageKey)
	}

	// Valid JPEG header: FF D8 FF
	jpegBytes := []byte{0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0}
	inputJPEG := model.FileInput{
		Reader:   bytes.NewReader(jpegBytes),
		Filename: "photo.jpg",
		Size:     int64(len(jpegBytes)),
	}

	attachment2, err := svc.SaveImage("documentation", inputJPEG)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if attachment2.ContentType != "image/jpeg" {
		t.Errorf("contentType = %s, want image/jpeg", attachment2.ContentType)
	}
	if !strings.HasSuffix(attachment2.StorageKey, ".jpg") {
		t.Errorf("storageKey = %s, want .jpg suffix", attachment2.StorageKey)
	}
}

func TestFileSystemUploadService_SaveImage_InvalidExtension(t *testing.T) {
	uploadDir := t.TempDir()
	svc := NewFileSystemUploadService(uploadDir)

	input := model.FileInput{
		Reader:   strings.NewReader("data"),
		Filename: "photo.gif",
		Size:     4,
	}

	_, err := svc.SaveImage("documentation", input)
	if err == nil || !errors.Is(err, ErrInvalidImageFile) {
		t.Fatalf("expected ErrInvalidImageFile for .gif, got: %v", err)
	}
}

func TestFileSystemUploadService_SaveImage_InvalidMIME(t *testing.T) {
	uploadDir := t.TempDir()
	svc := NewFileSystemUploadService(uploadDir)

	input := model.FileInput{
		Reader:   strings.NewReader("not an image but named png"),
		Filename: "fake.png",
		Size:     26,
	}

	_, err := svc.SaveImage("documentation", input)
	if err == nil || !errors.Is(err, ErrInvalidImageFile) {
		t.Fatalf("expected ErrInvalidImageFile for content mismatch, got: %v", err)
	}
}

func TestFileSystemUploadService_DeleteFile(t *testing.T) {
	uploadDir := t.TempDir()
	svc := NewFileSystemUploadService(uploadDir)

	// Create test file
	subDir := filepath.Join(uploadDir, "surat-kunjungan")
	if err := os.MkdirAll(subDir, 0o750); err != nil {
		t.Fatalf("mkdir failed: %v", err)
	}
	testFilePath := filepath.Join(subDir, "test.pdf")
	if err := os.WriteFile(testFilePath, []byte("content"), 0o640); err != nil {
		t.Fatalf("write failed: %v", err)
	}

	// Delete existing
	if err := svc.DeleteFile("surat-kunjungan/test.pdf"); err != nil {
		t.Fatalf("DeleteFile failed: %v", err)
	}
	if _, err := os.Stat(testFilePath); !errors.Is(err, os.ErrNotExist) {
		t.Errorf("file should have been deleted, got: %v", err)
	}

	// Delete non-existent should succeed silently (idempotent)
	if err := svc.DeleteFile("surat-kunjungan/notfound.pdf"); err != nil {
		t.Fatalf("DeleteFile on missing file should return nil, got: %v", err)
	}
}

func TestFileSystemUploadService_ResolvePath_Success(t *testing.T) {
	uploadDir := t.TempDir()
	svc := NewFileSystemUploadService(uploadDir)

	resolved, err := svc.ResolvePath("surat-kunjungan/test.pdf")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	expected := filepath.Join(uploadDir, "surat-kunjungan", "test.pdf")
	if resolved != expected {
		t.Errorf("ResolvePath = %q, want %q", resolved, expected)
	}
}

func TestFileSystemUploadService_ResolvePath_PathTraversal(t *testing.T) {
	uploadDir := t.TempDir()
	svc := NewFileSystemUploadService(uploadDir)

	traversalKeys := []string{
		"../secret.txt",
		"../../etc/passwd",
		"..\\..\\windows\\system32",
		"/etc/passwd",
		"C:\\Windows\\System32\\calc.exe",
		"surat-kunjungan/../../secret.txt",
		"surat-kunjungan/../../../secret.txt",
		".",
		"",
	}

	for _, key := range traversalKeys {
		t.Run(key, func(t *testing.T) {
			_, err := svc.ResolvePath(key)
			if err == nil || !errors.Is(err, ErrInvalidPath) {
				t.Fatalf("expected ErrInvalidPath for %q, got: %v", key, err)
			}
		})
	}
}

func TestFileSystemUploadService_DeleteFile_PathTraversal(t *testing.T) {
	uploadDir := t.TempDir()
	svc := NewFileSystemUploadService(uploadDir)

	// Create an outside file that should NOT be deleted
	outsideDir := t.TempDir()
	outsideFile := filepath.Join(outsideDir, "important.txt")
	if err := os.WriteFile(outsideFile, []byte("preserve me"), 0o640); err != nil {
		t.Fatal(err)
	}

	relToOutside, err := filepath.Rel(uploadDir, outsideFile)
	if err != nil {
		t.Fatal(err)
	}

	err = svc.DeleteFile(relToOutside)
	if err == nil || !errors.Is(err, ErrInvalidPath) {
		t.Fatalf("expected ErrInvalidPath, got: %v", err)
	}

	// Verify outside file still exists
	if _, err := os.Stat(outsideFile); err != nil {
		t.Fatalf("outside file was deleted! %v", err)
	}
}

func TestFileSystemUploadService_SaveImage_DirectoryTraversal(t *testing.T) {
	uploadDir := t.TempDir()
	svc := NewFileSystemUploadService(uploadDir)

	pngBytes := []byte{0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n', 0, 0, 0, 0}
	inputPNG := model.FileInput{
		Reader:   bytes.NewReader(pngBytes),
		Filename: "photo.png",
		Size:     int64(len(pngBytes)),
	}

	traversalDirs := []string{
		"../outside",
		"..",
		"/absolute",
		"sub/../../outside",
	}

	for _, dir := range traversalDirs {
		t.Run(dir, func(t *testing.T) {
			_, err := svc.SaveImage(dir, inputPNG)
			if err == nil || !errors.Is(err, ErrInvalidPath) {
				t.Fatalf("expected ErrInvalidPath for dir %q, got: %v", dir, err)
			}
		})
	}
}

