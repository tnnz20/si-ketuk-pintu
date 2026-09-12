package model

// ErrorResponse is the standard JSON body for API errors.
type ErrorResponse struct {
	Error string `json:"error"`
}
