package model

import "time"

// WITAOffsetMillis is the Asia/Makassar (UTC+8) offset in milliseconds.
const WITAOffsetMillis = int64(8 * 60 * 60 * 1000)

// WITATimeZone is the fixed Asia/Makassar (UTC+8) time zone used for all
// visit date and time handling.
var WITATimeZone = time.FixedZone("Asia/Makassar", 8*60*60)
