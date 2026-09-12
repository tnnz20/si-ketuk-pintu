package usecase

import (
	"fmt"

	qrcode "github.com/skip2/go-qrcode"
)

// QRUsecase generates QR code images for visit request tokens.
type QRUsecase struct{}

// NewQRUsecase creates a QRUsecase.
func NewQRUsecase() *QRUsecase {
	return &QRUsecase{}
}

// GenerateQR encodes the given token as a 256x256 PNG QR code.
func (u *QRUsecase) GenerateQR(token string) ([]byte, error) {
	png, err := qrcode.Encode(token, qrcode.Medium, 256)
	if err != nil {
		return nil, fmt.Errorf("generate qr code: %w", err)
	}

	return png, nil
}
