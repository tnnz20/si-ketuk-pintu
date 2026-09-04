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
	TanggalKunjungan int64 `json:"tanggal_kunjungan" binding:"required"`
	JamKunjungan     int64 `json:"jam_kunjungan" binding:"required"`
}
