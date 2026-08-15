# Compose and Prettier Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Makefile commands for stopping/removing Compose resources and add `npm run prettier` for frontend TypeScript formatting.

**Architecture:** Reuse existing `COMPOSE`, `check-env`, and frontend npm command patterns. Add no dependencies or new runtime code.

**Tech Stack:** GNU Make, Docker Compose, npm, Prettier 3.

## Global Constraints

- Scope Prettier to `apps/frontend`.
- `compose-down-v` must use `docker compose down -v` and requires `check-env`.
- Keep existing `format` and `format:check` scripts unchanged.
- Do not add dependencies.

---

### Task 1: Add Compose and Prettier commands

**Files:**
- Modify: `Makefile:9-45,62-66`
- Modify: `apps/frontend/package.json:6-12`

**Interfaces:**
- `make compose-stop`: stops Compose containers without removing them.
- `make compose-down-v`: stops and removes Compose containers plus volumes.
- `make frontend-prettier`: runs frontend `npm run prettier`.
- `npm --prefix apps/frontend run prettier`: formats frontend files using existing Prettier config.

- [ ] **Step 1: Update frontend script**

Add this entry beside existing formatting scripts in `apps/frontend/package.json`:

```json
"prettier": "prettier --write ."
```

Keep `format` and `format:check` unchanged.

- [ ] **Step 2: Update Makefile declarations and help**

Add `compose-stop`, `compose-down-v`, and `frontend-prettier` to `.PHONY`. Add help entries describing stop, volume removal, and frontend formatting.

- [ ] **Step 3: Add Compose targets**

Add:

```make
compose-stop: check-env
	$(COMPOSE) stop

compose-down-v: check-env
	$(COMPOSE) down -v
```

Place them beside existing `compose-down`.

- [ ] **Step 4: Add frontend target**

Add:

```make
frontend-prettier:
	npm --prefix $(FRONTEND_DIR) run prettier
```

Place it beside existing frontend formatting targets.

- [ ] **Step 5: Run formatting**

Run:

```text
npm --prefix apps/frontend run prettier
```

Expected: Prettier completes successfully and formats only frontend files.

- [ ] **Step 6: Verify Makefile commands without changing containers**

Run:

```text
make help
make -n compose-stop
make -n compose-down-v
make -n frontend-prettier
```

Expected: help lists all new targets; dry runs show `check-env` and correct Docker/npm commands.

- [ ] **Step 7: Run project verification**

Run the repository's available lint and typecheck commands:

```text
npm --prefix apps/frontend run lint
npm --prefix apps/frontend run build
```

Expected: both commands pass.
