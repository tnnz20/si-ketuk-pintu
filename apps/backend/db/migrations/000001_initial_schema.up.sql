CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE visit_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE attachment_kind AS ENUM ('surat_kunjungan', 'surat_tugas');
CREATE TYPE audit_actor_type AS ENUM ('visitor', 'administrator', 'system');

CREATE TABLE administrators (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT administrators_username_not_blank CHECK (LENGTH(BTRIM(username)) > 0),
    CONSTRAINT administrators_email_not_blank CHECK (LENGTH(BTRIM(email)) > 0)
);

CREATE UNIQUE INDEX administrators_username_lower_unique
    ON administrators (LOWER(username));
CREATE UNIQUE INDEX administrators_email_lower_unique
    ON administrators (LOWER(email));

CREATE TABLE visit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(18) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    nama_instansi TEXT NOT NULL,
    alamat_instansi TEXT NOT NULL,
    tanggal_kunjungan DATE NOT NULL,
    jam_kunjungan TIME NOT NULL,
    tema_kunjungan TEXT NOT NULL,
    pimpinan_rombongan TEXT NOT NULL,
    jumlah_tamu INTEGER NOT NULL,
    kontak_dihubungi TEXT NOT NULL,
    status visit_request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT visit_requests_token_format
        CHECK (token ~ '^SKP-[0-9]{8}-[A-Z0-9]{5}$'),
    CONSTRAINT visit_requests_guest_count_positive CHECK (jumlah_tamu > 0),
    CONSTRAINT visit_requests_email_not_blank CHECK (LENGTH(BTRIM(email)) > 0),
    CONSTRAINT visit_requests_organization_not_blank CHECK (LENGTH(BTRIM(nama_instansi)) > 0)
);

CREATE INDEX visit_requests_status_visit_date_index
    ON visit_requests (status, tanggal_kunjungan);
CREATE INDEX visit_requests_visit_date_index
    ON visit_requests (tanggal_kunjungan);

CREATE TABLE guests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    visit_request_id UUID NOT NULL REFERENCES visit_requests(id) ON DELETE RESTRICT,
    guest_order INTEGER NOT NULL,
    nama TEXT NOT NULL,
    jabatan TEXT NOT NULL,
    CONSTRAINT guests_order_positive CHECK (guest_order > 0),
    CONSTRAINT guests_name_not_blank CHECK (LENGTH(BTRIM(nama)) > 0),
    CONSTRAINT guests_position_not_blank CHECK (LENGTH(BTRIM(jabatan)) > 0),
    CONSTRAINT guests_request_order_unique UNIQUE (visit_request_id, guest_order)
);

CREATE INDEX guests_visit_request_id_index ON guests (visit_request_id);

CREATE TABLE attachments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    visit_request_id UUID NOT NULL REFERENCES visit_requests(id) ON DELETE RESTRICT,
    attachment_type attachment_kind NOT NULL,
    original_name TEXT NOT NULL,
    storage_key TEXT NOT NULL UNIQUE,
    content_type VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT attachments_original_name_not_blank CHECK (LENGTH(BTRIM(original_name)) > 0),
    CONSTRAINT attachments_storage_key_not_blank CHECK (LENGTH(BTRIM(storage_key)) > 0),
    CONSTRAINT attachments_size_within_limit CHECK (size_bytes > 0 AND size_bytes <= 5242880),
    CONSTRAINT attachments_checksum_sha256_format CHECK (checksum_sha256 ~ '^[a-f0-9]{64}$'),
    CONSTRAINT attachments_request_type_unique UNIQUE (visit_request_id, attachment_type)
);

CREATE INDEX attachments_visit_request_id_index ON attachments (visit_request_id);

CREATE TABLE audit_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    visit_request_id UUID REFERENCES visit_requests(id) ON DELETE RESTRICT,
    administrator_id BIGINT REFERENCES administrators(id) ON DELETE RESTRICT,
    actor_type audit_actor_type NOT NULL,
    action VARCHAR(128) NOT NULL,
    previous_value JSONB NOT NULL DEFAULT '{}'::JSONB,
    new_value JSONB NOT NULL DEFAULT '{}'::JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT audit_events_action_not_blank CHECK (LENGTH(BTRIM(action)) > 0)
);

CREATE INDEX audit_events_visit_request_occurred_at_index
    ON audit_events (visit_request_id, occurred_at DESC);
CREATE INDEX audit_events_administrator_occurred_at_index
    ON audit_events (administrator_id, occurred_at DESC);

