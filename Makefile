BACKEND_DIR := apps/backend
FRONTEND_DIR := apps/frontend
ENV_FILE := $(BACKEND_DIR)/.env
ENGINE ?= podman
COMPOSE := $(ENGINE) compose --env-file $(ENV_FILE)
MIGRATE_VERSION := v4.19.1
MIGRATE_CLI := go run -tags postgres github.com/golang-migrate/migrate/v4/cmd/migrate@$(MIGRATE_VERSION)

.DEFAULT_GOAL := help
.PHONY: help check-env check-engine compose-up compose-down compose-stop compose-down-v compose-logs be-run be-build tidy be-test be-test-unit be-test-migrations fe-dev fe-install fe-build fe-lint fe-format-check fe-prettier fe-preview migrate-up migrate-down migrate-version migrate-create seed-admin

help:
	@echo "Backend:"
	@echo "  be-run               Start backend on http://localhost:8080"
	@echo "  be-build             Build backend"
	@echo "  tidy                 Tidy backend Go dependencies"
	@echo "  be-test              Run all tests"
	@echo "  be-test-unit         Run unit tests"
	@echo "  be-test-migrations   Run integration tests"
	@echo "  migrate-up           Apply migrations"
	@echo "  migrate-down         Rollback migrations"
	@echo "  migrate-version      Show migration version"
	@echo "  migrate-create name=X Create new migration"
	@echo "  seed-admin           Seed first admin user"
	@echo ""
	@echo "Frontend:"
	@echo "  fe-dev               Start frontend dev server"
	@echo "  fe-install           Install frontend dependencies"
	@echo "  fe-build             Build frontend"
	@echo "  fe-lint              Run ESLint"
	@echo "  fe-format-check      Check code format"
	@echo "  fe-prettier          Format frontend files"
	@echo "  fe-preview            Preview production build"
	@echo ""
	@echo "Docker:"
	@echo "  Set ENGINE=podman|docker before command (default: podman)"
	@echo "  compose-up           Start PostgreSQL container"
	@echo "  compose-stop         Stop containers; keep containers and volumes"
	@echo "  compose-down         Stop/remove containers and network; keep volumes"
	@echo "  compose-down-v       Stop/remove containers, network, and volumes"
	@echo "  compose-logs         Follow PostgreSQL container logs"

check-env:
	@test -f $(ENV_FILE) || (echo "Copy $(BACKEND_DIR)/.env.example to $(ENV_FILE) first."; exit 1)

check-engine:
	@test "$(ENGINE)" = podman || test "$(ENGINE)" = docker || (echo "ENGINE must be podman or docker, got '$(ENGINE)'"; exit 1)

compose-up: check-env check-engine
	$(COMPOSE) up -d --wait postgres

compose-down: check-env check-engine
	$(COMPOSE) down

compose-stop: check-env check-engine
	$(COMPOSE) stop

compose-down-v: check-env check-engine
	$(COMPOSE) down -v

compose-logs: check-env check-engine
	$(COMPOSE) logs -f postgres

be-run: check-env
	@set -a; . $(ENV_FILE); set +a; cd $(BACKEND_DIR) && go run ./cmd/web

be-build:
	go -C $(BACKEND_DIR) build ./...

tidy:
	go -C $(BACKEND_DIR) mod tidy

fe-dev:
	npm --prefix $(FRONTEND_DIR) run dev

fe-install:
	npm --prefix $(FRONTEND_DIR) install

fe-build:
	npm --prefix $(FRONTEND_DIR) run build

fe-lint:
	npm --prefix $(FRONTEND_DIR) run lint

fe-format-check:
	npm --prefix $(FRONTEND_DIR) run format:check

fe-prettier:
	npm --prefix $(FRONTEND_DIR) run prettier

fe-preview:
	npm --prefix $(FRONTEND_DIR) run preview

be-test: be-test-unit be-test-migrations

be-test-unit:
	go -C $(BACKEND_DIR) test ./internal/...

be-test-migrations: check-env compose-up
	@set -a; . $(ENV_FILE); set +a; \
	$(COMPOSE) exec -T postgres psql -U "$$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$$TEST_POSTGRES_DB\";"; \
	$(COMPOSE) exec -T postgres psql -U "$$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$$TEST_POSTGRES_DB\";"; \
	go -C $(BACKEND_DIR) test ./test/integration

migrate-up: check-env
	@set -a; . $(ENV_FILE); set +a; cd $(BACKEND_DIR) && go run ./cmd/migrate up

migrate-down: check-env
	@set -a; . $(ENV_FILE); set +a; cd $(BACKEND_DIR) && go run ./cmd/migrate down

migrate-version: check-env
	@set -a; . $(ENV_FILE); set +a; cd $(BACKEND_DIR) && go run ./cmd/migrate version

migrate-create:
	@test -n "$(name)" || (echo "Usage: make migrate-create name=describe_change"; exit 1)
	$(MIGRATE_CLI) create -seq -digits 6 -ext sql -dir $(BACKEND_DIR)/db/migrations $(name)

seed-admin: check-env
	@set -a; . $(ENV_FILE); set +a; cd $(BACKEND_DIR) && go run ./cmd/seed-admin
