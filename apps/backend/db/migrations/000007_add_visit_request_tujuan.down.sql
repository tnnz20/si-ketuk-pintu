ALTER TABLE visit_requests
    DROP CONSTRAINT IF EXISTS visit_requests_tujuan_bagian_not_blank,
    DROP CONSTRAINT IF EXISTS visit_requests_tujuan_instansi_not_blank;

ALTER TABLE visit_requests
    DROP COLUMN IF EXISTS tujuan_bagian,
    DROP COLUMN IF EXISTS tujuan_instansi;
