package entity

import (
	"time"

	"github.com/google/uuid"
)

type VisitRequest struct {
	ID                uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Token             string    `gorm:"size:18;not null;uniqueIndex"`
	Email             string    `gorm:"size:255;not null"`
	NamaInstansi      string    `gorm:"not null"`
	AlamatInstansi    string    `gorm:"not null"`
	TanggalKunjungan  time.Time `gorm:"type:date;not null"`
	JamKunjungan      time.Time `gorm:"type:time;not null"`
	TemaKunjungan     string    `gorm:"not null"`
	PimpinanRombongan string    `gorm:"not null"`
	JumlahTamu        int       `gorm:"not null"`
	KontakDihubungi   string    `gorm:"not null"`
	Status            string    `gorm:"size:16;not null"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
	Guests            []Guest
	Attachments       []Attachment
	AuditEvents       []AuditEvent
}
