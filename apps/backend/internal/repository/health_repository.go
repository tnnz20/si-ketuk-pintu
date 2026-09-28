package repository

import "context"

// HealthRepository defines connectivity checks for readiness probes.
type HealthRepository interface {
	IsReady(ctx context.Context) error
}
