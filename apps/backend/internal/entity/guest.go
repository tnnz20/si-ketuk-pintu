package entity

import "github.com/google/uuid"

type Guest struct {
	ID             int64     `gorm:"primaryKey"`
	VisitRequestID uuid.UUID `gorm:"type:uuid;not null;index"`
	GuestOrder     int       `gorm:"not null"`
	Nama           string    `gorm:"not null"`
	Jabatan        string    `gorm:"not null"`
}
