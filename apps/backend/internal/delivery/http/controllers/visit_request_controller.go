package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

const witaOffsetMillis = model.WITAOffsetMillis

func normalizedDayMod(value int64) int64 {
	mod := value % (24 * 60 * 60 * 1000)
	if mod < 0 {
		mod += 24 * 60 * 60 * 1000
	}
	return mod
}

func isWITAMidnight(value int64) bool {
	return normalizedDayMod(value) == (24*60*60*1000)-witaOffsetMillis
}

func isWITATimeOfDay(value int64) bool {
	timeOfDay := value + witaOffsetMillis
	return timeOfDay >= 0 && timeOfDay < 24*60*60*1000 && timeOfDay%60000 == 0
}

type VisitRequestController struct {
	visitRequestUsecase *usecase.VisitRequestUsecase
	qrUsecase           *usecase.QRUsecase
	logger              *logrus.Logger
	uploadDir           string
}

func NewVisitRequestController(
	visitRequestUsecase *usecase.VisitRequestUsecase,
	qrUsecase *usecase.QRUsecase,
	logger *logrus.Logger,
	uploadDir string,
) *VisitRequestController {
	return &VisitRequestController{
		visitRequestUsecase: visitRequestUsecase,
		qrUsecase:           qrUsecase,
		logger:              logger,
		uploadDir:           uploadDir,
	}
}

func (c *VisitRequestController) Create(ginContext *gin.Context) {
	var request model.CreateVisitRequestRequest
	if err := ginContext.ShouldBind(&request); err != nil {
		c.logger.WithError(err).Warn("failed to bind request body")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: err.Error()})
		return
	}

	if !isWITAMidnight(request.TanggalKunjungan) {
		c.logger.Warn("invalid tanggal_kunjungan epoch value")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "tanggal_kunjungan must be Unix epoch milliseconds of the visit date midnight in Asia/Makassar (UTC+8)"})
		return
	}

	if !isWITATimeOfDay(request.JamKunjungan) {
		c.logger.Warn("invalid jam_kunjungan epoch value")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "jam_kunjungan must be Unix epoch milliseconds of the visit time on 1970-01-01 in Asia/Makassar (UTC+8)"})
		return
	}

	visitDateTime := request.TanggalKunjungan + (request.JamKunjungan + witaOffsetMillis)
	if visitDateTime < time.Now().UnixMilli() {
		c.logger.Warn("visit date and time is in the past")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "visit date and time must be in the future"})
		return
	}

	guestsJSON := ginContext.PostForm("guests")
	if guestsJSON == "" {
		c.logger.Warn("guests field is empty")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "guests field is required"})
		return
	}

	var guests []model.GuestInput
	if err := json.Unmarshal([]byte(guestsJSON), &guests); err != nil {
		c.logger.WithError(err).Warn("failed to unmarshal guests JSON")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "guests must be a valid JSON array"})
		return
	}

	suratKunjunganFile, suratKunjunganHeader, err := ginContext.Request.FormFile("surat_kunjungan")
	if err != nil {
		c.logger.WithError(err).Warn("missing surat_kunjungan file")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "surat_kunjungan file is required"})
		return
	}
	defer suratKunjunganFile.Close()

	suratTugasFile, suratTugasHeader, err := ginContext.Request.FormFile("surat_tugas")
	if err != nil {
		c.logger.WithError(err).Warn("missing surat_tugas file")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "surat_tugas file is required"})
		return
	}
	defer suratTugasFile.Close()

	input := usecase.CreateVisitRequestInput{
		Email:             request.Email,
		NamaInstansi:      request.NamaInstansi,
		AlamatInstansi:    request.AlamatInstansi,
		TanggalKunjungan:  request.TanggalKunjungan,
		JamKunjungan:      request.JamKunjungan,
		TemaKunjungan:     request.TemaKunjungan,
		PimpinanRombongan: request.PimpinanRombongan,
		JumlahTamu:        request.JumlahTamu,
		KontakDihubungi:   request.KontakDihubungi,
		Guests:            guests,
		SuratKunjungan: usecase.FileInput{
			Reader:   suratKunjunganFile,
			Filename: suratKunjunganHeader.Filename,
			Size:     suratKunjunganHeader.Size,
		},
		SuratTugas: usecase.FileInput{
			Reader:   suratTugasFile,
			Filename: suratTugasHeader.Filename,
			Size:     suratTugasHeader.Size,
		},
	}

	visitRequest, err := c.visitRequestUsecase.Create(ginContext.Request.Context(), input)
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidPDF) || strings.Contains(err.Error(), "guest count") || strings.Contains(err.Error(), "exceeds 5 MB limit") {
			c.logger.WithError(err).Warn("unprocessable entity when creating visit request")
			ginContext.JSON(http.StatusUnprocessableEntity, model.ErrorResponse{Error: err.Error()})
			return
		}
		c.logger.WithError(err).Error("failed to create visit request")
		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	ginContext.JSON(http.StatusCreated, model.CreateVisitRequestResponse{
		Token:   visitRequest.Token,
		Message: "Permintaan kunjungan berhasil dikirim. Simpan token atau QR code Anda untuk melacak status.",
	})
}

func (c *VisitRequestController) FindByToken(ginContext *gin.Context) {
	token := ginContext.Param("token")
	visitRequest, err := c.visitRequestUsecase.FindByToken(ginContext.Request.Context(), token)
	if err != nil {
		if errors.Is(err, repository.ErrVisitRequestNotFound) {
			c.logger.WithField("token", token).Warn("visit request not found by token")
			ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "request not found"})
			return
		}
		c.logger.WithError(err).Error("failed to find visit request by token")
		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	ginContext.JSON(http.StatusOK, toVisitRequestResponse(visitRequest))
}

func (c *VisitRequestController) DownloadAttachment(ginContext *gin.Context) {
	token := ginContext.Param("token")
	attachmentType := ginContext.Param("type")
	if attachmentType != "surat_kunjungan" && attachmentType != "surat_tugas" {
		c.logger.WithField("attachmentType", attachmentType).Warn("invalid attachment type")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "attachment type must be surat_kunjungan or surat_tugas"})
		return
	}

	visitRequest, err := c.visitRequestUsecase.FindByToken(ginContext.Request.Context(), token)
	if err != nil {
		if errors.Is(err, repository.ErrVisitRequestNotFound) {
			c.logger.WithField("token", token).Warn("visit request not found for attachment download")
			ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "request not found"})
			return
		}
		c.logger.WithError(err).Error("failed to find visit request for attachment download")
		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	for _, attachment := range visitRequest.Attachments {
		if attachment.AttachmentType == attachmentType {
			filePath := filepath.Join(c.uploadDir, attachment.StorageKey)
			if _, err := os.Stat(filePath); err != nil {
				c.logger.WithError(err).Warn("attachment file not found on disk")
				ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "file not found"})
				return
			}

			ginContext.Header("Content-Disposition", fmt.Sprintf("inline; filename=%s", attachment.OriginalName))
			ginContext.File(filePath)
			return
		}
	}

	c.logger.WithField("attachmentType", attachmentType).Warn("attachment not found in database record")
	ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "attachment not found"})
}

func (c *VisitRequestController) DownloadQR(ginContext *gin.Context) {
	token := ginContext.Param("token")

	_, err := c.visitRequestUsecase.FindByToken(ginContext.Request.Context(), token)
	if err != nil {
		if errors.Is(err, repository.ErrVisitRequestNotFound) {
			c.logger.WithField("token", token).Warn("visit request not found for QR download")
			ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "request not found"})
			return
		}
		c.logger.WithError(err).Error("failed to find visit request for QR download")
		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	png, err := c.qrUsecase.GenerateQR(token)
	if err != nil {
		c.logger.WithError(err).Error("failed to generate QR code")
		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	ginContext.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s.png", token))
	ginContext.Data(http.StatusOK, "image/png", png)
}

func toAttachmentResponse(a entity.Attachment) model.AttachmentResponse {
	return model.AttachmentResponse{
		ID:             a.ID,
		AttachmentType: a.AttachmentType,
		OriginalName:   a.OriginalName,
		ContentType:    a.ContentType,
		SizeBytes:      a.SizeBytes,
	}
}

func toVisitRequestResponse(vr *entity.VisitRequest) model.VisitRequestResponse {
	guests := make([]model.GuestResponse, 0, len(vr.Guests))
	for _, g := range vr.Guests {
		guests = append(guests, model.GuestResponse{
			GuestOrder: g.GuestOrder,
			Nama:       g.Nama,
			Jabatan:    g.Jabatan,
		})
	}

	attachments := make([]model.AttachmentResponse, 0, len(vr.Attachments))
	for _, a := range vr.Attachments {
		attachments = append(attachments, toAttachmentResponse(a))
	}

	return model.VisitRequestResponse{
		ID:                vr.ID.String(),
		Token:             vr.Token,
		Email:             vr.Email,
		NamaInstansi:      vr.NamaInstansi,
		AlamatInstansi:    vr.AlamatInstansi,
		TanggalKunjungan:  vr.TanggalKunjungan,
		JamKunjungan:      vr.JamKunjungan,
		TemaKunjungan:     vr.TemaKunjungan,
		PimpinanRombongan: vr.PimpinanRombongan,
		JumlahTamu:        vr.JumlahTamu,
		KontakDihubungi:   vr.KontakDihubungi,
		Status:            vr.Status,
		Guests:            guests,
		Attachments:       attachments,
		CreatedAt:         vr.CreatedAt,
		UpdatedAt:         vr.UpdatedAt,
	}
}
