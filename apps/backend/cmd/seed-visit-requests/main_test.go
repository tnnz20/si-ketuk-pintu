package main

import (
	"fmt"
	"testing"
	"time"
)

func TestSeedVisitRequests(t *testing.T) {
	now := time.Date(2026, 9, 7, 10, 0, 0, 0, time.UTC)
	requests := seedVisitRequests(now)

	if len(requests) != 5 {
		t.Fatalf("seeded %d requests, want 5", len(requests))
	}

	statuses := map[string]bool{}
	tokens := map[string]bool{}
	for i, request := range requests {
		if request.Token == "" || request.Email == "" || request.NamaInstansi == "" {
			t.Fatalf("request %q is missing required fields", request.Token)
		}
		wantToken := "SKP-20260907-" + fmt.Sprintf("%05d", i+1)
		if request.Token != wantToken {
			t.Errorf("request %d token = %q, want %q", i+1, request.Token, wantToken)
		}
		if tokens[request.Token] {
			t.Fatalf("duplicate token %q", request.Token)
		}
		tokens[request.Token] = true
		if request.TanggalKunjungan <= now.UnixMilli() {
			t.Fatalf("request %q is not scheduled in the future", request.Token)
		}
		if request.JumlahTamu <= 0 || len(request.Guests) != request.JumlahTamu {
			t.Fatalf("request %q has invalid guest data", request.Token)
		}
		statuses[request.Status] = true
	}

	for _, status := range []string{"pending", "approved", "rejected"} {
		if !statuses[status] {
			t.Errorf("seed data does not include %q status", status)
		}
	}
}
