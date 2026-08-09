package usecase

import (
	"fmt"

	qrcode "github.com/skip2/go-qrcode"
)

type QRUsecase struct{}

func NewQRUsecase() *QRUsecase {
	return &QRUsecase{}
}

func (u *QRUsecase) GenerateQR(token string) ([]byte, error) {
	png, err := qrcode.Encode(token, qrcode.Medium, 256)
	if err != nil {
		return nil, fmt.Errorf("generate qr code: %w", err)
	}

	return png, nil
}
