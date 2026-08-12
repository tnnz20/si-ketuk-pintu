# Backend Storage Key Fix Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix `storage_key` unique constraint violation by generating timestamp-suffixed filenames per-attachment.

**Architecture:** Modify `savePDF` to append timestamp to filename, ensuring per-request per-attachment unique storage keys.

**Tech Stack:** Go, GORM, UUID, standard library.

## Global Constraints

- Backend is Go in `apps/backend/internal/`
- Follow existing `golang-code-style` conventions
- Minimal change to fix root cause
- `storage_key` format: `{visitRequestID}/{attachmentType}_{timestamp}.pdf`
- Build must pass: `go build ./...`

---

### Task 1: Fix storage_key in savePDF

**Files:**
- Modify: `apps/backend/internal/usecase/visit_request_usecase.go`

**Interfaces:**
- Consumes: `time.Now()`, `filepath.Join`
- Produces: Unique `storage_key` per attachment

- [ ] **Step 1: Add timestamp to storage_key**

Change line 295 from:
```go
storageKey := filepath.Join(visitRequestID.String(), attachmentType+".pdf")
```
To:
```go
timestamp := time.Now().UnixNano()
storageKey := filepath.Join(visitRequestID.String(), fmt.Sprintf("%s_%d.pdf", attachmentType, timestamp))
```

- [ ] **Step 2: Add fmt import**

Add `fmt` to imports if not present.

- [ ] **Step 3: Build backend**

```bash
cd apps/backend && go build ./...
```

---

### Task 2: Verify build passes

**Files:**
- Run: `apps/backend`

- [ ] **Step 1: Full build**

```bash
cd apps/backend && go build ./...
```

- [ ] **Step 2: Confirm fix**

Upload 2 PDFs → both should have different `storage_key` (timestamp suffix).
