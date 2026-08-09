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
