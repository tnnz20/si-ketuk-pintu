# Backend

Go API for visitor request submission, status tracking, administrator workflows, document handling, and request archiving.

## Tech stack

- Go 1.25
- Gin and gin-contrib/cors
- GORM with PostgreSQL driver
- pgx PostgreSQL driver
- golang-migrate migrations
- JWT authentication with `golang-jwt/jwt`
- UUID identifiers with `google/uuid`
- Godotenv local configuration
- Logrus logging
- QR code generation with `go-qrcode`
- `x/crypto` and `x/time`

## Requirements

- Go 1.25+
- PostgreSQL, or Docker/Podman with Compose
- GNU Make for root commands

## Setup

From repository root:

```bash
cp apps/backend/.env.example apps/backend/.env
make compose-up
make migrate-up
```

Set admin values in `apps/backend/.env`, then run:

```bash
make seed-admin
make be-run
```

API: `http://localhost:8080`

Health checks:

- `GET /api/healthz`
- `GET /api/readyz`

## Usage

```bash
make be-run
make be-build
make tidy
make be-test-unit
make be-test-migrations
make be-test
make migrate-up
make migrate-down
make migrate-version
make migrate-create name=describe_change
make seed-admin
make seed-visit-requests
```

Use `ssh=true` with migration and seed commands when configured for an SSH tunnel. Use `make migrate-force version=N` to clear dirty migration state.

## Environment

Copy `.env.example` to `.env`. Main settings:

- `APP_HOST`, `APP_PORT`, and `LOG_LEVEL`
- `POSTGRES_*` database connection
- `TEST_POSTGRES_*` integration-test database connection
- `UPLOAD_DIR` uploaded file storage
- `JWT_SECRET` and `JWT_EXPIRY_HOURS`
- `CORS_ORIGINS`
- `RATE_LIMIT_RPS`
- `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`
- `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` for initial admin seed

Do not commit `.env` or production secrets.

## API routes

### Health

- `GET /api/healthz`
- `GET /api/readyz`

### Public requests

- `POST /api/public/requests`
- `GET /api/public/requests/:token`
- `GET /api/public/requests/:token/attachments/:type`
- `GET /api/public/requests/:token/attachments/:type/:attachment_id`
- `GET /api/public/requests/:token/qr`

### Admin authentication

- `POST /api/admin/auth/login`

### Authenticated admin

- `GET /api/admin/stats`
- `GET /api/admin/requests`
- `GET /api/admin/requests/graph`
- `GET /api/admin/requests/:id`
- `PATCH /api/admin/requests/:id/status`
- `PATCH /api/admin/requests/:id/reschedule`
- `DELETE /api/admin/requests/:id`
- `GET /api/admin/requests/:id/attachments/:type`
- `POST /api/admin/requests/:id/approval-letter`
- `DELETE /api/admin/requests/:id/approval-letter`
- `POST /api/admin/requests/:id/reschedule-letter`
- `DELETE /api/admin/requests/:id/reschedule-letter`
- `GET /api/admin/archives`
- `POST /api/admin/archives/:id/documentations`
- `DELETE /api/admin/archives/:id/documentations/:attachment_id`
- `POST /api/admin/archives/:id/daftar-absen`
- `DELETE /api/admin/archives/:id/daftar-absen`
- `GET /api/admin/archives/:id/attachments/:attachment_type/:attachment_id`

## Structure

```text
.
├── cmd/                 Web, migration, and seed executables
├── db/migrations/       Sequential SQL migrations
├── entity/              Database entities
├── internal/
│   ├── config/          Application configuration
│   ├── delivery/http/   Routes, controllers, and middleware
│   ├── repository/      GORM persistence
│   └── usecase/         Business rules
├── model/               API models
└── test/integration/    Integration tests
```

`db/migrations` is database source of truth. GORM does not run automatic schema migrations.
