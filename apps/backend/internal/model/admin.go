package model

// LoginRequest is the payload for the admin login endpoint.
type LoginRequest struct {
	Identifier     string `json:"identifier" binding:"required"`
	Password       string `json:"password" binding:"required"`
	TurnstileToken string `json:"turnstile_token"`
}

// LoginResponse returns the JWT issued after a successful login.
type LoginResponse struct {
	Token string `json:"token"`
}

// UpdateStatusRequest is the payload for changing a visit request status.
type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending approved rejected"`
}

// RescheduleRequest is the payload for rescheduling a visit request.
type RescheduleRequest struct {
	TanggalKunjungan int64 `json:"tanggal_kunjungan" binding:"required"`
	JamKunjungan     int64 `json:"jam_kunjungan" binding:"required"`
}
