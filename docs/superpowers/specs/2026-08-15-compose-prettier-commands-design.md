# Compose and Prettier Commands Design

## Scope

Add container lifecycle and frontend formatting commands without new dependencies.

## Makefile

- `compose-stop` runs `docker compose --env-file apps/backend/.env stop` after `check-env`.
- `compose-down-v` runs `docker compose --env-file apps/backend/.env down -v` after `check-env`; this removes Compose-managed volumes.
- Both targets appear in `.PHONY` and `help`.
- `frontend-prettier` runs `npm --prefix apps/frontend run prettier` and appears in `help`.

## Frontend package script

- Add `prettier` script: `prettier --write .`.
- Keep existing `format` and `format:check` scripts unchanged.

## Validation

- Run `npm --prefix apps/frontend run prettier`.
- Run Makefile help and dry-run targets with `make -n`.
