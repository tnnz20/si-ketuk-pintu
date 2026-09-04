package controllers

import (
	"encoding/json"
	"errors"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/delivery/http/middleware"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

type AdminRequestController struct {
	visitRequestUsecase *usecase.VisitRequestUsecase
	logger              *logrus.Logger
	uploadDir           string
}

func NewAdminRequestController(
	visitRequestUsecase *usecase.VisitRequestUsecase,
	logger *logrus.Logger,
	uploadDir string,
) *AdminRequestController {
	return &AdminRequestController{
		visitRequestUsecase: visitRequestUsecase,
		logger:              logger,
		uploadDir:           uploadDir,
	}
}

func (c *AdminRequestController) List(ginContext *gin.Context) {
	c.listRequests(ginContext, ginContext.Query("status"))
}

func (c *AdminRequestController) ListArchives(ginContext *gin.Context) {
	c.listRequests(ginContext, "approved")
}

func (c *AdminRequestController) listRequests(ginContext *gin.Context, status string) {
	page, _ := strconv.Atoi(ginContext.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(ginContext.DefaultQuery("page_size", "20"))

	filter := model.ListFilter{
		Search: ginContext.Query("search"),
		Status: status,
		Date:   ginContext.Query("date"),
		Page:   page,
		Size:   size,
	}

	visitRequests, total, err := c.visitRequestUsecase.List(ginContext.Request.Context(), filter)
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidDateFilter) {
			c.logger.WithError(err).Warn("invalid date filter in admin controller")
			ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "date must be in YYYY-MM-DD format"})
			return
		}
		c.logger.WithError(err).Error("failed to list visit requests in admin controller")
		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	items := make([]model.VisitRequestListItem, 0, len(visitRequests))
	for _, vr := range visitRequests {
		items = append(items, model.VisitRequestListItem{
			ID:                vr.ID.String(),
			Token:             vr.Token,
			NamaInstansi:      vr.NamaInstansi,
			PimpinanRombongan: vr.PimpinanRombongan,
			TanggalKunjungan:  vr.TanggalKunjungan,
			JumlahTamu:        vr.JumlahTamu,
			Status:            vr.Status,
			CreatedAt:         vr.CreatedAt,
		})
	}

	if size < 1 {
		size = 20
	}

	totalPages := int(math.Ceil(float64(total) / float64(size)))

	ginContext.JSON(http.StatusOK, model.VisitRequestListResponse{
		Data:       items,
		Total:      total,
		Page:       page,
		PageSize:   size,
		TotalPages: totalPages,
	})
}

func (c *AdminRequestController) Stats(ginContext *gin.Context) {
	today, pending, total, err := c.visitRequestUsecase.Stats(ginContext.Request.Context())
	if err != nil {
		c.logger.WithError(err).Error("failed to get admin stats")
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	ginContext.JSON(http.StatusOK, gin.H{
		"today_requests":   today,
		"pending_approval": pending,
		"total_requests":   total,
	})
}

func (c *AdminRequestController) Graph(ginContext *gin.Context) {
	period := ginContext.Query("period")
	if period != "daily" && period != "monthly" && period != "yearly" {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "period must be daily, monthly, or yearly"})
		return
	}

	year, _ := strconv.Atoi(ginContext.DefaultQuery("year", "2026"))
	month, _ := strconv.Atoi(ginContext.Query("month"))
	if period == "daily" && (month < 1 || month > 12) {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "month (1-12) is required for daily period"})
		return
	}

	points, err := c.visitRequestUsecase.Graph(ginContext.Request.Context(), period, year, month)
	if err != nil {
		c.logger.WithError(err).Error("failed to get graph data")
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	resp := make([]model.GraphPointResponse, 0, len(points))
	for _, point := range points {
		resp = append(resp, model.GraphPointResponse{
			Period: point.Period.Format("2006-01-02"),
			Count:  point.Count,
		})
	}

	ginContext.JSON(http.StatusOK, gin.H{"data": resp})
}

func (c *AdminRequestController) FindByID(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		c.logger.WithError(err).Warn("invalid request ID format")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}

	visitRequest, err := c.visitRequestUsecase.FindByID(ginContext.Request.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrVisitRequestNotFound) {
			c.logger.WithField("id", id).Warn("visit request not found by ID")
			ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "request not found"})
			return
		}

		c.logger.WithError(err).Error("failed to find visit request by ID")
		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	response := toVisitRequestResponse(visitRequest)

	auditEvents := make([]model.AuditEventResponse, 0, len(visitRequest.AuditEvents))
	for _, ae := range visitRequest.AuditEvents {
		var previousValue any
		_ = json.Unmarshal(ae.PreviousValue, &previousValue)

		var newValue any
		_ = json.Unmarshal(ae.NewValue, &newValue)

		auditEvents = append(auditEvents, model.AuditEventResponse{
			ID:            ae.ID,
			ActorType:     ae.ActorType,
			Action:        ae.Action,
			PreviousValue: previousValue,
			NewValue:      newValue,
			OccurredAt:    ae.OccurredAt,
		})
	}

	ginContext.JSON(http.StatusOK, gin.H{
		"request":      response,
		"audit_events": auditEvents,
	})
}

func (c *AdminRequestController) UpdateStatus(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		c.logger.WithError(err).Warn("invalid request ID format")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}

	var request model.UpdateStatusRequest
	if err := ginContext.ShouldBindJSON(&request); err != nil {
		c.logger.WithError(err).Warn("failed to bind update status request")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: err.Error()})
		return
	}

	administratorID, _ := ginContext.Get(middleware.AdministratorIDKey)

	err = c.visitRequestUsecase.UpdateStatus(ginContext.Request.Context(), usecase.UpdateStatusInput{
		VisitRequestID:  id,
		NewStatus:       request.Status,
		AdministratorID: administratorID.(int64),
	})
	if err != nil {
		if errors.Is(err, repository.ErrVisitRequestNotFound) {
			c.logger.WithField("id", id).Warn("visit request not found for status update")
			ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "request not found"})
			return
		}
		if strings.Contains(err.Error(), "status transition") {
			ginContext.JSON(http.StatusConflict, model.ErrorResponse{Error: err.Error()})
			return
		}

		c.logger.WithError(err).Error("failed to update visit request status")
		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	ginContext.JSON(http.StatusOK, gin.H{"message": "status updated"})
}

func (c *AdminRequestController) Delete(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		c.logger.WithError(err).Warn("invalid request ID format")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}

	if err := c.visitRequestUsecase.Delete(ginContext.Request.Context(), id); err != nil {
		if errors.Is(err, repository.ErrVisitRequestNotFound) {
			ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "request not found"})
			return
		}
		c.logger.WithError(err).Error("failed to delete visit request")
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	ginContext.JSON(http.StatusOK, gin.H{"message": "Permohonan berhasil dihapus"})
}

func (c *AdminRequestController) Reschedule(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}
	var input model.RescheduleRequest
	if err := ginContext.ShouldBindJSON(&input); err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: err.Error()})
		return
	}
	if !isWITAMidnight(input.TanggalKunjungan) {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "tanggal_kunjungan must be Unix epoch milliseconds of the visit date midnight in Asia/Makassar (UTC+8)"})
		return
	}
	if !isWITATimeOfDay(input.JamKunjungan) {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "jam_kunjungan must be Unix epoch milliseconds of the visit time on 1970-01-01 in Asia/Makassar (UTC+8)"})
		return
	}

	visitDateTime := input.TanggalKunjungan + (input.JamKunjungan + witaOffsetMillis)
	if visitDateTime < time.Now().UnixMilli() {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "visit date and time must be in the future"})
		return
	}

	administratorID, _ := ginContext.Get(middleware.AdministratorIDKey)
	if err := c.visitRequestUsecase.Reschedule(ginContext.Request.Context(), usecase.RescheduleInput{
		VisitRequestID: id, NewDate: input.TanggalKunjungan, NewTime: input.JamKunjungan, AdministratorID: administratorID.(int64),
	}); err != nil {
		if errors.Is(err, repository.ErrVisitRequestNotFound) {
			ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "request not found"})
			return
		}
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: err.Error()})
		return
	}
	ginContext.JSON(http.StatusOK, gin.H{"message": "schedule rescheduled"})
}

func (c *AdminRequestController) UploadRescheduleLetter(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}
	file, header, err := ginContext.Request.FormFile("file")
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "file is required"})
		return
	}
	defer file.Close()
	attachment, err := c.visitRequestUsecase.SaveRescheduleLetter(ginContext.Request.Context(), id, usecase.FileInput{Reader: file, Filename: header.Filename, Size: header.Size})
	if err != nil {
		if errors.Is(err, repository.ErrVisitRequestNotFound) {
			ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "request not found"})
			return
		}
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: err.Error()})
		return
	}
	ginContext.JSON(http.StatusCreated, gin.H{"attachment": attachment})
}

func (c *AdminRequestController) DeleteRescheduleLetter(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}
	if err := c.visitRequestUsecase.DeleteRescheduleLetter(ginContext.Request.Context(), id); err != nil {
		if errors.Is(err, repository.ErrAttachmentNotFound) || errors.Is(err, usecase.ErrRescheduleLetterNotFound) {
			ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "reschedule letter not found"})
			return
		}
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "failed to delete reschedule letter"})
		return
	}
	ginContext.JSON(http.StatusOK, gin.H{"message": "reschedule letter deleted"})
}

func (c *AdminRequestController) UploadApprovalLetter(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}
	file, header, err := ginContext.Request.FormFile("file")
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "file is required"})
		return
	}
	defer file.Close()

	attachment, err := c.visitRequestUsecase.SaveApprovalLetter(ginContext.Request.Context(), id, usecase.FileInput{
		Reader: file, Filename: header.Filename, Size: header.Size,
	})
	if err != nil {
		if errors.Is(err, repository.ErrVisitRequestNotFound) {
			ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "request not found"})
			return
		}
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: err.Error()})
		return
	}
	ginContext.JSON(http.StatusCreated, gin.H{"attachment": attachment})
}

func (c *AdminRequestController) DeleteApprovalLetter(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}
	if err := c.visitRequestUsecase.DeleteApprovalLetter(ginContext.Request.Context(), id); err != nil {
		if errors.Is(err, usecase.ErrApprovalLetterNotFound) || errors.Is(err, repository.ErrAttachmentNotFound) || errors.Is(err, repository.ErrVisitRequestNotFound) {
			ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "approval letter not found"})
			return
		}
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "failed to delete approval letter"})
		return
	}
	ginContext.JSON(http.StatusOK, gin.H{"message": "approval letter deleted"})
}

func (c *AdminRequestController) DownloadAttachment(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		c.logger.WithError(err).Warn("invalid request ID format")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}

	attachmentType := ginContext.Param("type")
	if attachmentType != "surat_kunjungan" && attachmentType != "surat_tugas" && attachmentType != "surat_persetujuan" && attachmentType != "surat_reschedule" {
		c.logger.WithField("attachmentType", attachmentType).Warn("invalid attachment type")
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "attachment type must be surat_kunjungan or surat_tugas"})
		return
	}

	visitRequest, err := c.visitRequestUsecase.FindByID(ginContext.Request.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrVisitRequestNotFound) {
			c.logger.WithField("id", id).Warn("visit request not found for attachment download")
			ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "request not found"})
			return
		}
		c.logger.WithError(err).Error("failed to find visit request for attachment download")
		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	if (attachmentType == "surat_persetujuan" && visitRequest.Status != "approved") || (attachmentType == "surat_reschedule" && visitRequest.Status != "pending") {
		ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "approval letter not found"})
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

			ginContext.Header("Content-Disposition", "attachment; filename="+attachment.OriginalName)
			ginContext.File(filePath)
			return
		}
	}

	c.logger.WithField("attachmentType", attachmentType).Warn("attachment not found in database record")
	ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "attachment not found"})
}

func respondArchiveError(ginContext *gin.Context, err error) {
	switch {
	case errors.Is(err, repository.ErrVisitRequestNotFound):
		ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "request not found"})
	case errors.Is(err, repository.ErrAttachmentNotFound),
		errors.Is(err, usecase.ErrDocumentationNotFound),
		errors.Is(err, usecase.ErrDaftarAbsenNotFound):
		ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "attachment not found"})
	case errors.Is(err, usecase.ErrApprovalLetterExists), errors.Is(err, usecase.ErrDaftarAbsenExists):
		ginContext.JSON(http.StatusConflict, model.ErrorResponse{Error: err.Error()})
	case errors.Is(err, usecase.ErrArchiveRequestNotApproved):
		ginContext.JSON(http.StatusConflict, model.ErrorResponse{Error: err.Error()})
	case errors.Is(err, usecase.ErrInvalidPDF), errors.Is(err, usecase.ErrInvalidImageFile):
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: err.Error()})
	case strings.Contains(err.Error(), "exceeds"), strings.Contains(err.Error(), "unsupported extension"):
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: err.Error()})
	default:
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
	}
}

func (c *AdminRequestController) UploadDocumentations(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}

	form, err := ginContext.MultipartForm()
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "multipart form is invalid"})
		return
	}

	fileHeaders := form.File["files"]
	if len(fileHeaders) == 0 {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "files field is required"})
		return
	}

	inputs := make([]usecase.FileInput, 0, len(fileHeaders))
	for _, header := range fileHeaders {
		file, err := header.Open()
		if err != nil {
			ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "failed to read uploaded file"})
			return
		}
		defer file.Close()
		inputs = append(inputs, usecase.FileInput{Reader: file, Filename: header.Filename, Size: header.Size})
	}

	attachments, err := c.visitRequestUsecase.SaveDocumentationImages(ginContext.Request.Context(), id, inputs)
	if err != nil {
		respondArchiveError(ginContext, err)
		return
	}

	response := make([]model.AttachmentResponse, 0, len(attachments))
	for _, attachment := range attachments {
		response = append(response, toAttachmentResponse(attachment))
	}
	ginContext.JSON(http.StatusCreated, gin.H{"attachments": response})
}

func (c *AdminRequestController) DeleteDocumentation(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}
	attachmentID, err := strconv.ParseInt(ginContext.Param("attachment_id"), 10, 64)
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid attachment id"})
		return
	}

	if err := c.visitRequestUsecase.DeleteDocumentationImage(ginContext.Request.Context(), id, attachmentID); err != nil {
		respondArchiveError(ginContext, err)
		return
	}
	ginContext.JSON(http.StatusOK, gin.H{"message": "documentation image deleted"})
}

func (c *AdminRequestController) UploadDaftarAbsen(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}
	file, header, err := ginContext.Request.FormFile("file")
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "file is required"})
		return
	}
	defer file.Close()

	attachment, err := c.visitRequestUsecase.SaveDaftarAbsen(ginContext.Request.Context(), id, usecase.FileInput{
		Reader: file, Filename: header.Filename, Size: header.Size,
	})
	if err != nil {
		respondArchiveError(ginContext, err)
		return
	}
	ginContext.JSON(http.StatusCreated, gin.H{"attachment": toAttachmentResponse(*attachment)})
}

func (c *AdminRequestController) DeleteDaftarAbsen(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}

	if err := c.visitRequestUsecase.DeleteDaftarAbsen(ginContext.Request.Context(), id); err != nil {
		respondArchiveError(ginContext, err)
		return
	}
	ginContext.JSON(http.StatusOK, gin.H{"message": "attendance list deleted"})
}

func (c *AdminRequestController) DownloadArchiveAttachment(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}
	attachmentID, err := strconv.ParseInt(ginContext.Param("attachment_id"), 10, 64)
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid attachment id"})
		return
	}

	attachmentType := ginContext.Param("attachment_type")
	if attachmentType != "images" && attachmentType != "daftar_absen" {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "attachment type must be images or daftar_absen"})
		return
	}

	attachment, err := c.visitRequestUsecase.GetArchiveAttachment(ginContext.Request.Context(), id, attachmentID, attachmentType)
	if err != nil {
		respondArchiveError(ginContext, err)
		return
	}

	filePath := filepath.Join(c.uploadDir, filepath.FromSlash(attachment.StorageKey))
	file, err := os.Open(filePath)
	if err != nil {
		c.logger.WithError(err).Warn("archive attachment file not found on disk")
		ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "file not found"})
		return
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() {
		ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "file not found"})
		return
	}

	safeName := strings.Map(func(r rune) rune {
		if r == '"' || r < 0x20 || r == 0x7F {
			return '_'
		}
		return r
	}, filepath.Base(attachment.OriginalName))

	ginContext.Header("Content-Disposition", `attachment; filename="`+safeName+`"`)
	ginContext.Header("Content-Type", attachment.ContentType)
	http.ServeContent(ginContext.Writer, ginContext.Request, "", info.ModTime(), file)
}
