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
	page, _ := strconv.Atoi(ginContext.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(ginContext.DefaultQuery("page_size", "20"))

	filter := model.ListFilter{
		Search: ginContext.Query("search"),
		Status: ginContext.Query("status"),
		Date:   ginContext.Query("date"),
		Page:   page,
		Size:   size,
	}

	visitRequests, total, err := c.visitRequestUsecase.List(ginContext.Request.Context(), filter)
	if err != nil {
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
			TanggalKunjungan:  vr.TanggalKunjungan.Format("2006-01-02"),
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
	if attachmentType != "surat_kunjungan" && attachmentType != "surat_tugas" && attachmentType != "surat_persetujuan" {
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

	if attachmentType == "surat_persetujuan" && visitRequest.Status != "approved" {
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
