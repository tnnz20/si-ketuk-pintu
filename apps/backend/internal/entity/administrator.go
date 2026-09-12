package entity

// Administrator is a persisted admin account able to log in and manage
// visit requests.
type Administrator struct {
	ID           int64  `gorm:"primaryKey"`
	Username     string `gorm:"size:64;not null"`
	Email        string `gorm:"size:255;not null"`
	PasswordHash string `gorm:"not null"`
	IsActive     bool   `gorm:"not null"`
	CreatedAt    int64  `gorm:"autoCreateTime:milli"`
	UpdatedAt    int64  `gorm:"autoUpdateTime:milli"`
}
