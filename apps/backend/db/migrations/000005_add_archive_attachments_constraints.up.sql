ALTER TABLE attachments DROP CONSTRAINT attachments_request_type_unique;

CREATE UNIQUE INDEX attachments_daftar_absen_request_unique
    ON attachments (visit_request_id)
    WHERE attachment_type = 'daftar_absen';
