package controllers

import (
	"testing"
	"time"
)

var witaTestZone = time.FixedZone("Asia/Makassar", 8*60*60)

func TestIsWITAMidnight(t *testing.T) {
	tests := []struct {
		name  string
		value int64
		want  bool
	}{
		{name: "valid future date", value: time.Date(2030, 1, 1, 0, 0, 0, 0, witaTestZone).UnixMilli(), want: true},
		{name: "epoch date", value: time.Date(1970, 1, 1, 0, 0, 0, 0, witaTestZone).UnixMilli(), want: true},
		{name: "negative date before epoch", value: time.Date(1969, 12, 31, 0, 0, 0, 0, witaTestZone).UnixMilli(), want: true},
		{name: "zero", value: 0, want: false},
		{name: "negative arbitrary", value: -12345, want: false},
		{name: "midday", value: time.Date(2030, 1, 1, 12, 0, 0, 0, witaTestZone).UnixMilli(), want: false},
		{name: "utc midnight", value: time.Date(2030, 1, 1, 0, 0, 0, 0, time.UTC).UnixMilli(), want: false},
		{name: "overflow", value: 1 << 62, want: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := isWITAMidnight(test.value); got != test.want {
				t.Fatalf("isWITAMidnight(%d) = %v, want %v", test.value, got, test.want)
			}
		})
	}
}

func TestIsWITATimeOfDay(t *testing.T) {
	tests := []struct {
		name  string
		value int64
		want  bool
	}{
		{name: "midnight wita", value: time.Date(1970, 1, 1, 0, 0, 0, 0, witaTestZone).UnixMilli(), want: true},
		{name: "valid minute", value: time.Date(1970, 1, 1, 10, 30, 0, 0, witaTestZone).UnixMilli(), want: true},
		{name: "last minute", value: time.Date(1970, 1, 1, 23, 59, 0, 0, witaTestZone).UnixMilli(), want: true},
		{name: "zero equals 08:00 wita", value: 0, want: true},
		{name: "one day positive", value: 24 * 60 * 60 * 1000, want: false},
		{name: "below range", value: -28800001, want: false},
		{name: "seconds not minutes", value: time.Date(1970, 1, 1, 10, 30, 30, 0, witaTestZone).UnixMilli(), want: false},
		{name: "overflow", value: 1 << 62, want: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := isWITATimeOfDay(test.value); got != test.want {
				t.Fatalf("isWITATimeOfDay(%d) = %v, want %v", test.value, got, test.want)
			}
		})
	}
}
