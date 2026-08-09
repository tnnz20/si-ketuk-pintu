BACKEND_DIR := apps/backend
ENV_FILE := $(BACKEND_DIR)/.env
COMPOSE := docker compose --env-file $(ENV_FILE)
MIGRATE_VERSION := v4.19.1
MIGRATE_CLI := go run -tags postgres github.com/golang-migrate/migrate/v4/cmd/migrate@$(MIGRATE_VERSION)

.DEFAULT_GOAL := help
.PHONY: help check-env compose-up compose-down compose-logs run build test test-unit test-migrations migrate-up migrate-down migrate-version migrate-create seed-admin

help:
	@echo "Targets: compose-up compose-down compose-logs run build test test-unit test-migrations migrate-up migrate-down migrate-version migrate-create seed-admin"

check-env:
	@test -f $(ENV_FILE) || (echo "Copy $(BACKEND_DIR)/.env.example to $(ENV_FILE) first."; exit 1)

compose-up: check-env
	$(COMPOSE) up -d --wait postgres

compose-down: check-env
	$(COMPOSE) down

compose-logs: check-env
	$(COMPOSE) logs -f postgres

run: check-env
	@set -a; . $(ENV_FILE); set +a; cd $(BACKEND_DIR) && go run ./cmd/web

build:
	go -C $(BACKEND_DIR) build ./...

test: test-unit test-migrations

test-unit:
	go -C $(BACKEND_DIR) test ./internal/...

test-migrations: check-env compose-up
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
