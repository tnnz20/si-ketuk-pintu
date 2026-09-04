ALTER TABLE administrators
    ALTER COLUMN created_at DROP DEFAULT,
    ALTER COLUMN updated_at DROP DEFAULT,
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING (to_timestamp(created_at / 1000.0)),
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING (to_timestamp(updated_at / 1000.0)),
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE visit_requests
    ALTER COLUMN created_at DROP DEFAULT,
    ALTER COLUMN updated_at DROP DEFAULT,
    ALTER COLUMN tanggal_kunjungan TYPE DATE
        USING ((to_timestamp(tanggal_kunjungan / 1000.0) AT TIME ZONE 'Asia/Makassar')::DATE),
    ALTER COLUMN jam_kunjungan TYPE TIME
        USING ((to_timestamp((jam_kunjungan + 28800000) / 1000.0) AT TIME ZONE 'UTC')::TIME),
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING (to_timestamp(created_at / 1000.0)),
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING (to_timestamp(updated_at / 1000.0)),
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE attachments
    ALTER COLUMN created_at DROP DEFAULT,
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING (to_timestamp(created_at / 1000.0)),
    ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE audit_events
    ALTER COLUMN occurred_at DROP DEFAULT,
    ALTER COLUMN occurred_at TYPE TIMESTAMPTZ USING (to_timestamp(occurred_at / 1000.0)),
    ALTER COLUMN occurred_at SET DEFAULT NOW();
