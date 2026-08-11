# Si Ketuk Pintu

Initial Go backend foundation for the Government Visitor Request Platform.

## Local setup

1. Copy `apps/backend/.env.example` to `apps/backend/.env` and replace the example PostgreSQL password.
2. Run `make compose-up`.
3. Run `make migrate-up`.
4. Set `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `apps/backend/.env`, then run `make seed-admin` once.
5. Run `make run` and check `http://localhost:8080/healthz` and `http://localhost:8080/readyz`.

The backend reads environment variables and optionally loads `apps/backend/.env` for local development. PostgreSQL runs through `compose.yaml` as `postgres:alpine` with a persistent named volume.

## Frontend setup

1. Copy `apps/frontend/.env.example` to `apps/frontend/.env`.
2. Run `npm install` from `apps/frontend`.
3. Run `npm run dev` and open `http://localhost:5173`.

`VITE_API_URL` defaults to `http://localhost:8080` for local backend access. The backend example CORS configuration already allows Vite's local origin.

Use `npm run lint`, `npm run format:check`, and `npm run build` before deployment. `apps/frontend/nginx.conf` serves the generated single-page application from `/usr/share/nginx/html`.

## Commands

Run `make help` for all available commands. The most common are:

- `make compose-up` / `make compose-down` — manage PostgreSQL.
- `make migrate-up` / `make migrate-down` / `make migrate-version` — manage schema migrations.
- `make migrate-create name=add_feature` — create paired sequential SQL migrations.
- `make seed-admin` — create the first Administrator; it never overwrites an existing account.
- `make test` — run unit and isolated database migration checks.

`apps/backend/db/migrations` is the database source of truth. GORM is used for database access only and does not run automatic schema migrations.
