package model

// HealthResponse is the JSON body for health check endpoints.
type HealthResponse struct {
	Status string `json:"status"`
}
