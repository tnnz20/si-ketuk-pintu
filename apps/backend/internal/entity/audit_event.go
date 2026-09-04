package entity

import (
	"encoding/json"

	"github.com/google/uuid"
)

type AuditEvent struct {
	ID              int64           `gorm:"primaryKey"`
	VisitRequestID  *uuid.UUID      `gorm:"type:uuid;index"`
	AdministratorID *int64          `gorm:"index"`
	ActorType       string          `gorm:"size:32;not null"`
	Action          string          `gorm:"size:128;not null"`
	PreviousValue   json.RawMessage `gorm:"type:jsonb;not null"`
	NewValue        json.RawMessage `gorm:"type:jsonb;not null"`
	OccurredAt      int64           `gorm:"not null"`
}
