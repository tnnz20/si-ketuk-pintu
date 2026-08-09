DROP TABLE IF EXISTS audit_events;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS guests;
DROP TABLE IF EXISTS visit_requests;
DROP TABLE IF EXISTS administrators;

DROP TYPE IF EXISTS audit_actor_type;
DROP TYPE IF EXISTS attachment_kind;
DROP TYPE IF EXISTS visit_request_status;

DROP EXTENSION IF EXISTS pgcrypto;

