DROP INDEX IF EXISTS attachments_daftar_absen_request_unique;

ALTER TABLE attachments ADD CONSTRAINT attachments_request_type_unique
    UNIQUE (visit_request_id, attachment_type);
