package model

import "time"

type GuestInput struct {
	Nama    string `json:"nama" binding:"required"`
	Jabatan string `json:"jabatan" binding:"required"`
}

type CreateVisitRequestRequest struct {
	Email             string `form:"email" binding:"required,email"`
	NamaInstansi      string `form:"nama_instansi" binding:"required"`
	AlamatInstansi    string `form:"alamat_instansi" binding:"required"`
	TanggalKunjungan  int64  `form:"tanggal_kunjungan" binding:"required"`
	JamKunjungan      int64  `form:"jam_kunjungan" binding:"required"`
	TemaKunjungan     string `form:"tema_kunjungan" binding:"required"`
	PimpinanRombongan string `form:"pimpinan_rombongan" binding:"required"`
	JumlahTamu        int    `form:"jumlah_tamu" binding:"required,min=1"`
	KontakDihubungi   string `form:"kontak_dihubungi" binding:"required"`
}

type GuestResponse struct {
	GuestOrder int    `json:"guest_order"`
	Nama       string `json:"nama"`
	Jabatan    string `json:"jabatan"`
}

type AttachmentResponse struct {
	ID             int64  `json:"id"`
	AttachmentType string `json:"attachment_type"`
	OriginalName   string `json:"original_name"`
	ContentType    string `json:"content_type"`
	SizeBytes      int64  `json:"size_bytes"`
}

type VisitRequestResponse struct {
	ID                string               `json:"id"`
	Token             string               `json:"token"`
	Email             string               `json:"email"`
	NamaInstansi      string               `json:"nama_instansi"`
	AlamatInstansi    string               `json:"alamat_instansi"`
	TanggalKunjungan  int64                `json:"tanggal_kunjungan"`
	JamKunjungan      int64                `json:"jam_kunjungan"`
	TemaKunjungan     string               `json:"tema_kunjungan"`
	PimpinanRombongan string               `json:"pimpinan_rombongan"`
	JumlahTamu        int                  `json:"jumlah_tamu"`
	KontakDihubungi   string               `json:"kontak_dihubungi"`
	Status            string               `json:"status"`
	Guests            []GuestResponse      `json:"guests"`
	Attachments       []AttachmentResponse `json:"attachments"`
	CreatedAt         int64                `json:"created_at"`
	UpdatedAt         int64                `json:"updated_at"`
}

type VisitRequestListItem struct {
	ID                string `json:"id"`
	Token             string `json:"token"`
	NamaInstansi      string `json:"nama_instansi"`
	PimpinanRombongan string `json:"pimpinan_rombongan"`
	TanggalKunjungan  int64  `json:"tanggal_kunjungan"`
	JumlahTamu        int    `json:"jumlah_tamu"`
	Status            string `json:"status"`
	CreatedAt         int64  `json:"created_at"`
}

type VisitRequestListResponse struct {
	Data       []VisitRequestListItem `json:"data"`
	Total      int64                  `json:"total"`
	Page       int                    `json:"page"`
	PageSize   int                    `json:"page_size"`
	TotalPages int                    `json:"total_pages"`
}

type CreateVisitRequestResponse struct {
	Token   string `json:"token"`
	Message string `json:"message"`
}

type ListFilter struct {
	Search    string
	Status    string
	Date      string
	DateEpoch int64
	Page      int
	Size      int
}

type GraphPoint struct {
	Period time.Time
	Count  int64
}

type GraphPointResponse struct {
	Period string `json:"period"`
	Count  int64  `json:"count"`
}
