# Si Ketuk Pintu — Government Visitor Request Platform

## 1. Executive Summary

### Problem Statement

Government visitor requests are difficult to manage and track consistently when handled through disconnected channels. Agencies need one durable system for receiving requests, reviewing visitor information, and recording decisions.

### Proposed Solution

Si Ketuk Pintu is a self-hosted, responsive web application where anonymous visitors submit a visit request and receive a secure token plus a downloadable QR code. The single authenticated Administrator reviews requests and changes their status.

### Success Criteria

- 100% of valid submissions generate a unique token in `SKP-YYYYMMDD-XXXXX` format.
- 100% of generated tokens produce a downloadable QR code containing the token.
- The Administrator can locate and update any request through search, filtering, token entry, or QR scanning.
- Valid token holders can view request status, details, and uploaded PDFs.
- All status changes are recorded in an audit log.

## 2. User Experience & Functionality

### Actors

- **Visitor:** Anonymous public user who submits a request and uses a token or QR code to retrieve it. This is an external actor, not an authenticated application role.
- **Administrator:** The only authenticated role. Manages requests, scans QR codes, views documents, and changes statuses.

### Visitor Submission Form

The form must contain the following required fields:

1. `email` — valid email format.
2. `nama_instansi` — visiting organization name.
3. `alamat_instansi` — full organization address.
4. `tanggal_kunjungan` — planned visit date.
5. `jam_kunjungan` — planned arrival time.
6. `tema_kunjungan` — visit topic or purpose.
7. `pimpinan_rombongan` — delegation leader name.
8. `jumlah_tamu` — numeric guest count.
9. `kontak_dihubungi` — phone or WhatsApp contact.
10. `surat_kunjungan` — required PDF upload.
11. `surat_tugas` — required PDF upload.

### Dynamic Guest List

When `jumlah_tamu = N`, the form dynamically creates exactly `N` guest rows. Every row requires:

- `nama` — guest name.
- `jabatan` — guest position or title.

Client-side and server-side validation must reject non-PDF uploads. The MVP attachment limit is 5 MB per PDF.

### Token and QR Flow

- On successful submission, generate a unique token using this exact format:

  ```text
  SKP-YYYYMMDD-XXXXX
  ```

- `YYYYMMDD` represents the submission date.
- `XXXXX` is five random uppercase alphanumeric characters (`A–Z`, `0–9`).
- Display the token immediately after submission.
- Generate a downloadable PNG QR code containing the token text only.
- Provide public and Administrator QR-scanning experiences:
  - The public scanner opens the request status and detail view.
  - The Administrator scanner opens the request in the management workspace.
- Treat the token as a bearer credential. Anyone possessing a valid token may view the request status, details, guest list, and both uploaded PDFs.

### Status Workflow

The MVP supports these statuses:

- `Pending`
- `Approved`
- `Rejected`

Only the Administrator can change status. Visitors can view status but cannot edit requests or statuses.

### Administrator Capabilities

- Secure login using username or email and password.
- List all requests.
- Search by token and relevant request fields.
- Filter by status and visit date.
- Open complete request details.
- View or download uploaded PDFs.
- Scan QR codes.
- Change status to `Pending`, `Approved`, or `Rejected`.
- View an audit history of status changes and administrative actions.

### User Stories and Acceptance Criteria

#### Visitor submits a request

**Story:** As a visitor, I want to submit my organization and visit details so that the Administrator can review my visit request.

**Acceptance criteria:**

- All eleven required fields are displayed with the specified field names and types.
- Email validation rejects invalid email formats.
- `jumlah_tamu` accepts a numeric value and generates exactly that number of guest rows.
- Every generated guest row requires `nama` and `jabatan`.
- Both uploaded documents are required PDF files.
- Client-side and server-side validation reject non-PDF files and files larger than 5 MB.
- A valid submission is persisted with its guest list and attachments.

#### Visitor receives a token and QR code

**Story:** As a visitor, I want a token and QR code after submission so that I can retrieve my request later.

**Acceptance criteria:**

- The response displays a unique token matching `SKP-YYYYMMDD-XXXXX`.
- The QR code encodes the token text only.
- The visitor can download the QR code as a PNG image.
- The response instructs the visitor to retain the token or QR image.

#### Token holder views a request

**Story:** As a token holder, I want to view the request status and details so that I know how the request is being handled.

**Acceptance criteria:**

- A valid token opens the matching request.
- The view includes status, all submitted fields, the guest list, and both PDF downloads.
- Invalid or unknown tokens return a safe not-found response without exposing other records.
- Public QR scanning resolves to the same token-based view.

#### Administrator manages requests

**Story:** As the Administrator, I want to search, filter, inspect, and update requests so that I can manage visitor processing from one application.

**Acceptance criteria:**

- The Administrator must authenticate before accessing management features.
- The Administrator can list, search, and filter requests.
- The Administrator can open request details and documents.
- The Administrator can scan a QR code and open the matching management record.
- The Administrator can set the status to `Pending`, `Approved`, or `Rejected`.
- Every status change records the Administrator, previous status, new status, and timestamp.

### Non-Goals

- Visitor accounts.
- Multiple Administrator roles or agency-level permissions.
- Agency selection.
- Email, SMS, WhatsApp, or push notifications.
- Appointment-slot availability management.
- Check-in or check-out.
- Rescheduling or cancellation workflows.
- Native mobile applications.
- Government SSO or national identity integration.

## 3. AI System Requirements

AI is not applicable to the MVP. The product does not require AI models, AI tools, or AI evaluation.

## 4. Technical Specifications

### Architecture and Data Flow

1. The visitor submits the public form.
2. The client validates fields and dynamically generated guest rows.
3. The server repeats every validation, validates PDF MIME type and content, validates file size, stores the request and files, and generates the token.
4. The server returns the token and QR download information.
5. Token lookup or QR scanning resolves to the same public request-detail view.
6. Administrator authentication grants access to management endpoints.
7. Administrator status changes update the request and append an audit event.

The application is a responsive browser application deployed on a government-controlled server. The framework, hosting vendor, and specific relational database engine remain `TBD`.

### Core Data Entities

- `VisitRequest`
  - All submitted visitor form fields.
  - Generated token.
  - Current status.
  - Submission, update, and visit timestamps.
- `Guest`
  - `nama` and `jabatan`.
  - Belongs to one `VisitRequest`.
- `Attachment`
  - File metadata and storage reference.
  - Attachment type: `surat_kunjungan` or `surat_tugas`.
- `Administrator`
  - Login identifier, password hash, and account state.
- `AuditEvent`
  - Actor, action, affected request, previous value, new value, and timestamp.

### Public Interfaces

- `POST /public/requests` — create a visitor request.
- `GET /public/requests/{token}` — retrieve status, details, guest list, and PDF downloads.
- `GET /public/requests/{token}/qr` — download the token QR image.
- Public QR scanner — extracts the token and navigates to the public lookup view.

### Administrator Interfaces

- `POST /admin/auth/login` — authenticate the Administrator.
- `GET /admin/requests` — list, search, and filter requests.
- `GET /admin/requests/{id}` — retrieve the management detail view.
- `PATCH /admin/requests/{id}/status` — change the request status.
- Administrator QR scanner — extracts the token and opens the matching management record.
- Audit-history view — display actions for a selected request.

### Security and Privacy

- Hash Administrator passwords and use secure session management.
- Enforce server-side authorization for every Administrator endpoint.
- Use TLS, CSRF protection, input sanitization, and secure cookie settings.
- Rate-limit token lookup and QR/token resolution to reduce brute-force attempts.
- Generate the five-character suffix using a cryptographically secure random generator.
- Enforce token uniqueness with a database constraint and collision retry.
- Validate PDF content and MIME type on the server; never trust the filename extension alone.
- Store uploads in protected storage and scan them for malware where supported.
- Audit submissions, token lookups, document access, Administrator logins, status changes, and administrative actions.
- Uploaded PDFs are accessible to anyone holding the valid token, as required.
- Use a persistent relational database and durable file storage on the self-hosted server.
- Retain records indefinitely by default while the deployment exists.

## 5. Risks and Roadmap

### Phased Rollout

#### MVP

Public form, dynamic guest list, strict PDF validation, token generation, QR download, public token/QR lookup, Administrator login, request management, status updates, document access, audit log, and self-hosted deployment.

#### v1.1

CSV/PDF export, dashboard summaries, configurable retention, improved audit reporting, and optional notification integrations.

#### v2.0

Appointment scheduling, check-in/check-out, rescheduling, visitor accounts, government identity integration, and mobile clients.

### Technical Risks and Mitigations

- **Bearer-token guessing:** Use cryptographically secure randomness, rate limiting, monitoring, and lockouts.
- **Malicious PDFs:** Validate content and scan files before making them available.
- **Indefinite storage growth:** Monitor capacity and document backup and archival procedures.
- **QR camera incompatibility:** Retain manual token entry as a fallback.
- **Dynamic guest-list inconsistencies:** Test client/server count consistency and persist the request transactionally.
- **Token disclosure:** Display a warning that anyone with the token can access the request details and PDFs.

### Assumptions and Defaults

- The target deployment is Indonesia and Indonesian field names are preserved exactly.
- The first release is a responsive browser application.
- The application has one authenticated role: Administrator.
- Visitors are anonymous and do not create accounts.
- PNG is the default QR download format.
- The QR payload is the token text only.
- Public and Administrator scanners are both supported.
- Past visit dates and times are rejected by default.
- Tokens do not expire unless a later retention or security policy changes that decision.
- Initial KPI targets should be confirmed against government agency baselines.
