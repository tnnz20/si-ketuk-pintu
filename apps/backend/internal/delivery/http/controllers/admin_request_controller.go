package controllers

import (
	"encoding/json"
	"errors"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/delivery/http/middleware"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/usecase"
)

type AdminRequestController struct {
	visitRequestUsecase *usecase.VisitRequestUsecase
	uploadDir           string
}

func NewAdminRequestController(
	visitRequestUsecase *usecase.VisitRequestUsecase,
	uploadDir string,
) *AdminRequestController {
	return &AdminRequestController{
		visitRequestUsecase: visitRequestUsecase,
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

func (c *AdminRequestController) FindByID(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}

	visitRequest, err := c.visitRequestUsecase.FindByID(ginContext.Request.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrVisitRequestNotFound) {
			ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "request not found"})
			return
		}

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
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}

	var request model.UpdateStatusRequest
	if err := ginContext.ShouldBindJSON(&request); err != nil {
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
			ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "request not found"})
			return
		}

		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	ginContext.JSON(http.StatusOK, gin.H{"message": "status updated"})
}

func (c *AdminRequestController) DownloadAttachment(ginContext *gin.Context) {
	id, err := uuid.Parse(ginContext.Param("id"))
	if err != nil {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid request id"})
		return
	}

	attachmentType := ginContext.Param("type")
	if attachmentType != "surat_kunjungan" && attachmentType != "surat_tugas" {
		ginContext.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "attachment type must be surat_kunjungan or surat_tugas"})
		return
	}

	visitRequest, err := c.visitRequestUsecase.FindByID(ginContext.Request.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrVisitRequestNotFound) {
			ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "request not found"})
			return
		}
		_ = ginContext.Error(err)
		ginContext.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}

	for _, attachment := range visitRequest.Attachments {
		if attachment.AttachmentType == attachmentType {
			filePath := filepath.Join(c.uploadDir, attachment.StorageKey)
			if _, err := os.Stat(filePath); err != nil {
				ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "file not found"})
				return
			}

			ginContext.Header("Content-Disposition", "attachment; filename="+attachment.OriginalName)
			ginContext.File(filePath)
			return
		}
	}

	ginContext.JSON(http.StatusNotFound, model.ErrorResponse{Error: "attachment not found"})
}
