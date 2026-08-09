package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/tnnz20/si-ketuk-pintu/apps/backend/internal/config"
)

func main() {
	ctx := context.Background()
	bootstrap, err := config.NewBootstrap(ctx)
	if err != nil {
		panic(err)
	}
	defer func() {
		if err := bootstrap.Close(); err != nil {
			bootstrap.Logger.WithError(err).Error("close database")
		}
	}()

	server := &http.Server{
		Addr:              bootstrap.Config.HTTPAddress(),
		Handler:           bootstrap.Router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	serverErrors := make(chan error, 1)
	go func() {
		bootstrap.Logger.WithField("address", server.Addr).Info("http server started")
		serverErrors <- server.ListenAndServe()
	}()

	signalContext, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	select {
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			bootstrap.Logger.WithError(err).Fatal("http server stopped unexpectedly")
		}
	case <-signalContext.Done():
		bootstrap.Logger.Info("shutdown signal received")
	}

	shutdownContext, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownContext); err != nil {
		bootstrap.Logger.WithError(err).Error("graceful shutdown failed")
	}
}
