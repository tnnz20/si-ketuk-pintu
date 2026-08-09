package entity

import "github.com/google/uuid"

type Attachment struct {
	ID             int64     `gorm:"primaryKey"`
	VisitRequestID uuid.UUID `gorm:"type:uuid;not null;index"`
	AttachmentType string    `gorm:"size:32;not null"`
	OriginalName   string    `gorm:"not null"`
	StorageKey     string    `gorm:"not null"`
	ContentType    string    `gorm:"size:255;not null"`
	SizeBytes      int64     `gorm:"not null"`
	ChecksumSHA256 string    `gorm:"size:64;not null"`
}
