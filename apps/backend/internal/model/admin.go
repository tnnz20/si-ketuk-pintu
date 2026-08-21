package model

type LoginRequest struct {
	Identifier string `json:"identifier" binding:"required"`
	Password   string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending approved rejected"`
}

type RescheduleRequest struct {
	TanggalKunjungan string `json:"tanggal_kunjungan" binding:"required,datetime=2006-01-02"`
	JamKunjungan     string `json:"jam_kunjungan" binding:"required,datetime=15:04"`
}
