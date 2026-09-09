package main

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/config"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/entity"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/model"
	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/repository"
)

func main() {
	applicationConfig, err := config.Load()
	if err != nil {
		panic(err)
	}

	logger, err := config.NewLogger(applicationConfig.LogLevel)
	if err != nil {
		panic(err)
	}

	database, err := config.OpenDatabase(context.Background(), applicationConfig.DatabaseURL, logger)
	if err != nil {
		panic(err)
	}

	sqlDatabase, err := database.DB()
	if err != nil {
		panic(err)
	}
	defer sqlDatabase.Close()

	store := repository.NewVisitRequestRepository(database, logger)
	requests := seedVisitRequests(time.Now())
	created := 0
	for _, request := range requests {
		wasCreated, err := seedVisitRequest(context.Background(), store, &request)
		if err != nil {
			panic(err)
		}
		if wasCreated {
			created++
		}
	}

	logger.WithField("created", created).Info("visit request seed completed")
}

func seedVisitRequest(ctx context.Context, store *repository.VisitRequestRepository, request *entity.VisitRequest) (bool, error) {
	existing, err := store.FindByToken(ctx, request.Token)
	if err != nil && !errors.Is(err, repository.ErrVisitRequestNotFound) {
		return false, fmt.Errorf("check visit request %s: %w", request.Token, err)
	}
	if existing != nil {
		return false, nil
	}

	if err := store.Create(ctx, request); err != nil {
		return false, fmt.Errorf("create visit request %s: %w", request.Token, err)
	}
	return true, nil
}

func seedVisitRequests(now time.Time) []entity.VisitRequest {
	requests := make([]entity.VisitRequest, 0, 5)
	statuses := []string{"pending", "approved", "rejected", "pending", "approved"}
	tujuanInstansi := []string{"Sekretariat DPRD", "DPRD Kab. Tapin"}
	tujuanBagian := []string{"Kabag Hukum", "Komisi II"}
	seedDate := now.In(model.WITATimeZone).Format("20060102")
	for i := range 5 {
		visitDate := now.In(model.WITATimeZone).AddDate(0, 0, i+1)
		guests := make([]entity.Guest, i+2)
		for guestIndex := range guests {
			guests[guestIndex] = entity.Guest{
				GuestOrder: guestIndex + 1,
				Nama:       fmt.Sprintf("Tamu Dummy %d-%d", i+1, guestIndex+1),
				Jabatan:    "Peserta",
			}
		}
		requests = append(requests, entity.VisitRequest{
			Token:             fmt.Sprintf("SKP-%s-%05d", seedDate, i+1),
			Email:             fmt.Sprintf("dummy%d@example.com", i+1),
			NamaInstansi:      fmt.Sprintf("Instansi Dummy %d", i+1),
			AlamatInstansi:    fmt.Sprintf("Jl. Dummy No. %d, Makassar", i+1),
			TujuanInstansi:    tujuanInstansi[i%2],
			TujuanBagian:      tujuanBagian[i%2],
			TanggalKunjungan:  time.Date(visitDate.Year(), visitDate.Month(), visitDate.Day(), 0, 0, 0, 0, model.WITATimeZone).UnixMilli(),
			JamKunjungan:      time.Date(1970, 1, 1, 9+i, 0, 0, 0, model.WITATimeZone).UnixMilli(),
			TemaKunjungan:     fmt.Sprintf("Kunjungan dummy %d", i+1),
			PimpinanRombongan: fmt.Sprintf("Pimpinan Dummy %d", i+1),
			JumlahTamu:        i + 2,
			KontakDihubungi:   fmt.Sprintf("08123456789%d", i),
			Status:            statuses[i],
			Guests:            guests,
		})
	}
	return requests
}
