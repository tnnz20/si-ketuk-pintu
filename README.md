# Si Ketuk Pintu

Government visitor request platform for submitting, reviewing, tracking, and archiving visitor requests.

## Tech stack

### Frontend

- React 19 with TypeScript
- Vite 8
- React Router 7
- Tailwind CSS 4

### Backend

- Go 1.25
- Gin HTTP framework
- GORM with PostgreSQL
- golang-migrate database migrations

## Project structure

```text
.
├── apps
│   ├── backend
│   │   ├── cmd/                 Executables: web, migrate, and seed tools
│   │   ├── db/migrations/       Sequential SQL migrations
│   │   ├── entity/              Database entities
│   │   ├── internal/            Config, HTTP, repositories, and use cases
│   │   ├── model/               API models
│   │   └── test/integration/    Integration tests
│   └── frontend
│       ├── public/              Static assets
│       └── src
│           ├── components/      Reusable UI components
│           ├── constants/       Shared constants
│           ├── hooks/           React hooks
│           ├── lib/             API, PDF, and utility code
│           ├── pages/            Route-level screens
│           ├── schemas/         Zod schemas
│           └── types/            Shared TypeScript types
├── compose.yaml                 PostgreSQL and production services
├── Makefile                     Development commands
 ├── apps/backend/api/            Backend API contract
└── docs/                        Project documentation
```

## Requirements

- Go 1.25+
- Node.js and npm
- GNU Make
- PostgreSQL client tools
- Docker or Podman with Compose support

Set `ENGINE=docker` when using Docker. Default engine is Podman.

## Usage

1. Copy `apps/backend/.env.example` to `apps/backend/.env`.
2. Set PostgreSQL credentials and replace development secrets.
3. Start PostgreSQL:

   ```bash
   make compose-up
   ```

4. Apply migrations:

   ```bash
   make migrate-up
   ```

5. Set `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`, then seed admin:

   ```bash
   make seed-admin
   ```

6. Start backend and frontend in separate terminals:

   ```bash
   make be-run
   make fe-install
   make fe-dev
   ```

Backend: `http://localhost:8080`

Frontend: `http://localhost:5173`

Run `make help` to list all commands:

```text
Backend:
  be-run, be-build, tidy, be-test, be-test-unit, be-test-migrations
  migrate-up, migrate-down, migrate-version, migrate-force
  migrate-create, seed-admin, seed-visit-requests

SSH tunneling:
  migrate-up-ssh, migrate-down-ssh, migrate-version-ssh
  migrate-force-ssh, seed-admin-ssh, seed-visit-requests-ssh

Frontend:
  fe-dev, fe-install, fe-build, fe-lint
  fe-format-check, fe-prettier, fe-preview

Database:
  compose-up, compose-stop, compose-down, compose-down-v, compose-logs
```

Use `make migrate-create name=describe_change` to create migrations. Use `make compose-down-v` only when removing PostgreSQL data is intended.

## Checks

```bash
make be-test
make fe-lint
make fe-format-check
make fe-build
```

`apps/backend/db/migrations` is database source of truth. GORM does not run automatic schema migrations.
