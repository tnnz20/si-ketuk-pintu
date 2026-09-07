package model

import "time"

const WITAOffsetMillis = int64(8 * 60 * 60 * 1000)

var WITATimeZone = time.FixedZone("Asia/Makassar", 8*60*60)
