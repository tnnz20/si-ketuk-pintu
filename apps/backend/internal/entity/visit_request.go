package entity

import "github.com/google/uuid"

type VisitRequest struct {
	ID                uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Token             string    `gorm:"size:18;not null;uniqueIndex"`
	Email             string    `gorm:"size:255;not null"`
	NamaInstansi      string    `gorm:"not null"`
	AlamatInstansi    string    `gorm:"not null"`
	TanggalKunjungan  int64     `gorm:"not null"`
	JamKunjungan      int64     `gorm:"not null"`
	TemaKunjungan     string    `gorm:"not null"`
	PimpinanRombongan string    `gorm:"not null"`
	JumlahTamu        int       `gorm:"not null"`
	KontakDihubungi   string    `gorm:"not null"`
	Status            string    `gorm:"size:16;not null"`
	CreatedAt         int64     `gorm:"autoCreateTime:milli"`
	UpdatedAt         int64     `gorm:"autoUpdateTime:milli"`
	Guests            []Guest
	Attachments       []Attachment
	AuditEvents       []AuditEvent
}
