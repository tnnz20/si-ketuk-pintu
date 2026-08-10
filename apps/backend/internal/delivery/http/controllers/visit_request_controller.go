package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

type VisitRequestController struct {
	visitRequestUsecase *usecase.VisitRequestUsecase
	qrUsecase           *usecase.QRUsecase
	logger              *logrus.Logger
	timeZone            *time.Location
}

func NewVisitRequestController(
	visitRequestUsecase *usecase.VisitRequestUsecase,
	qrUsecase *usecase.QRUsecase,
	logger *logrus.Logger,
	timeZone *time.Location,
) *VisitRequestController {
	return &VisitRequestController{
		visitRequestUsecase: visitRequestUsecase,
		qrUsecase:           qrUsecase,
		logger:              logger,
		timeZone:            timeZone,
	}
}

func (c *VisitRequestController) Create(ginContext *gin.Context) {
	var request model.CreateVisitRequestRequest
	if err := ginContext.ShouldBind(&request); err != nil {
		c.logger.WithError(err).Warn("failed to bind request body")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: err.Error()})
		return
	}

	tanggalKunjungan, err := time.ParseInLocation("2006-01-02", request.TanggalKunjungan, c.timeZone)
	if err != nil {
		c.logger.WithError(err).Warn("invalid tanggal_kunjungan format")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "tanggal_kunjungan must be in YYYY-MM-DD format"})
		return
	}

	jamKunjungan, err := time.Parse("15:04", request.JamKunjungan)
	if err != nil {
		c.logger.WithError(err).Warn("invalid jam_kunjungan format")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "jam_kunjungan must be in HH:MM format"})
		return
	}

	now := time.Now().In(c.timeZone)
	visitDateTime := time.Date(
		tanggalKunjungan.Year(), tanggalKunjungan.Month(), tanggalKunjungan.Day(),
		jamKunjungan.Hour(), jamKunjungan.Minute(), 0, 0,
		c.timeZone,
	)
	if visitDateTime.Before(now) {
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
		TanggalKunjungan:  tanggalKunjungan,
		JamKunjungan:      jamKunjungan.Format("15:04:00"),
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
		attachments = append(attachments, model.AttachmentResponse{
			AttachmentType: a.AttachmentType,
			OriginalName:   a.OriginalName,
			ContentType:    a.ContentType,
			SizeBytes:      a.SizeBytes,
		})
	}

	jamKunjungan := vr.JamKunjungan
	if parsed, err := time.Parse("15:04:05", vr.JamKunjungan); err == nil {
		jamKunjungan = parsed.Format("15:04")
	} else if parsed, err := time.Parse("15:04", vr.JamKunjungan); err == nil {
		jamKunjungan = parsed.Format("15:04")
	}

	return model.VisitRequestResponse{
		ID:                vr.ID.String(),
		Token:             vr.Token,
		Email:             vr.Email,
		NamaInstansi:      vr.NamaInstansi,
		AlamatInstansi:    vr.AlamatInstansi,
		TanggalKunjungan:  vr.TanggalKunjungan.Format("2006-01-02"),
		JamKunjungan:      jamKunjungan,
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
