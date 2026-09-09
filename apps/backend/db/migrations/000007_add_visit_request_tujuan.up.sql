ALTER TABLE visit_requests
    ADD COLUMN tujuan_instansi TEXT NOT NULL DEFAULT '',
    ADD COLUMN tujuan_bagian TEXT NOT NULL DEFAULT '';

ALTER TABLE visit_requests
    ALTER COLUMN tujuan_instansi DROP DEFAULT,
    ALTER COLUMN tujuan_bagian DROP DEFAULT;
