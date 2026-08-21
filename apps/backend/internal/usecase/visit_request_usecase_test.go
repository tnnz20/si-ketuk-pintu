package usecase

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

func TestSavePDFStoresByAttachmentType(t *testing.T) {
	uploadDir := t.TempDir()
	usecase := NewVisitRequestUsecase(nil, nil, logrus.New(), uploadDir, nil)

	for _, test := range []struct {
		attachmentType string
		directory      string
	}{
		{attachmentType: "surat_kunjungan", directory: "surat-kunjungan"},
		{attachmentType: "surat_tugas", directory: "surat-tugas"},
	} {
		attachment, err := usecase.savePDF(uuid.New(), test.attachmentType, FileInput{
			Reader:   bytes.NewReader([]byte("%PDF-1.4\n%1234567890")),
			Filename: "document.pdf",
		})
		if err != nil {
			t.Fatalf("save %s: %v", test.attachmentType, err)
		}

		storageKey := filepath.ToSlash(attachment.StorageKey)
		prefix := test.directory + "/"
		if !strings.HasPrefix(storageKey, prefix) {
			t.Fatalf("storage key = %q, want prefix %q", storageKey, prefix)
		}
		if !strings.HasPrefix(filepath.Base(storageKey), test.attachmentType+"_") || !strings.HasSuffix(storageKey, ".pdf") {
			t.Fatalf("storage key = %q, want timestamp filename", storageKey)
		}
		if _, err := os.Stat(filepath.Join(uploadDir, filepath.FromSlash(storageKey))); err != nil {
			t.Fatalf("stored file missing: %v", err)
		}
	}
}

func TestSavePDFRejectsDirectoryPathThatIsFile(t *testing.T) {
	uploadDir := t.TempDir()
	if err := os.WriteFile(filepath.Join(uploadDir, "surat-kunjungan"), []byte("not a directory"), 0o640); err != nil {
		t.Fatal(err)
	}

	usecase := NewVisitRequestUsecase(nil, nil, logrus.New(), uploadDir, nil)
	_, err := usecase.savePDF(uuid.New(), "surat_kunjungan", FileInput{
		Reader:   bytes.NewReader([]byte("%PDF-1.4\n%1234567890")),
		Filename: "document.pdf",
	})
	if err == nil {
		t.Fatal("savePDF should reject a directory path that is a file")
	}
}

func TestSavePDFRejectsUnknownAttachmentType(t *testing.T) {
	uploadDir := t.TempDir()
	usecase := NewVisitRequestUsecase(nil, nil, logrus.New(), uploadDir, nil)
	_, err := usecase.savePDF(uuid.New(), "unknown", FileInput{
		Reader:   bytes.NewReader([]byte("%PDF-1.4\n%1234567890")),
		Filename: "document.pdf",
	})
	if err == nil {
		t.Fatal("savePDF should reject unknown attachment type")
	}
}
