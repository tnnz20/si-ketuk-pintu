# Frontend Validation & Toast Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Zod validation to form submission and integrate Sonner toast library for success/error feedback in the "Si Ketuk Pintu" visitor request form.

**Architecture:** Create Zod schema for visit request validation. Replace inline error state with toast notifications. Add `type` attribute to all buttons. Fix requirement icons to use consistent sizing with `shrink-0` and fixed container. Remove unused "Simpan Draft" button.

**Tech Stack:** Zod, Sonner, React 19, TypeScript, Tailwind CSS v4.

## Global Constraints

- Use existing project structure: `apps/frontend/src/`
- Follow existing design system: `src/index.css` tokens from DESIGN.md
- Match API_CONTRACT.md validation rules (PDF max 5MB, future date/time, guest count match)
- Build must pass: `npm run build`
- Lint must pass: `npm run lint`
- Keep icons consistent: fixed size container, `shrink-0`, `aria-hidden`

---

### Task 1: Install Dependencies

**Files:**
- Modify: `apps/frontend/package.json`
- Create: `apps/frontend/src/lib/validate.ts`
- Create: `apps/frontend/src/lib/types/visitRequestSchema.ts`

**Interfaces:**
- Consumes: none
- Produces: Zod schema exported from `validate.ts`

- [ ] **Step 1: Install zod and sonner**

```bash
cd apps/frontend && npm install zod sonner
```

- [ ] **Step 2: Create visitRequestSchema.ts**

Export Zod schema matching API_CONTRACT.md:
- `email`: email format
- `nama_instansi`: non-empty string
- `alamat_instansi`: non-empty string
- `tanggal_kunjungan`: date in future
- `jam_kunjungan`: time format
- `tema_kunjungan`: non-empty string
- `pimpinan_rombongan`: non-empty string
- `jumlah_tamu`: min 1 integer
- `kontak_dihubungi`: non-empty string
- `guests`: array with `nama` and `jabatan`
- `surat_kunjungan`: instance of File with type application/pdf, max 5MB
- `surat_tugas`: instance of File with type application/pdf, max 5MB

- [ ] **Step 3: Create validate.ts**

Export `validateVisitRequest(data: VisitRequestData)` function that:
- Uses Zod schema `.safeParse()` 
- Returns `{ valid: true, data }` on success
- Returns `{ valid: false, errors: ZodError }` on failure

- [ ] **Step 4: Run lint and build**

```bash
npm run lint && npm run build
```

---

### Task 2: Add Sonner Toaster to App

**Files:**
- Modify: `apps/frontend/src/app.tsx`
- Modify: `apps/frontend/src/main.tsx`

**Interfaces:**
- Consumes: `Toaster` from `sonner`
- Produces: Toast container rendered for all routes

- [ ] **Step 1: Import Toaster in app.tsx**

Import `{ Toaster } from 'sonner'` and render `<Toaster />` inside Layout.

- [ ] **Step 2: Run build**

```bash
npm run build
```

---

### Task 3: Refactor SubmissionForm with Zod and Toast

**Files:**
- Modify: `apps/frontend/src/pages/public/SubmissionForm.tsx`

**Interfaces:**
- Consumes: `validateVisitRequest` from `validate.ts`, `toast` from `sonner`
- Produces: Form with Zod validation and toast feedback

- [ ] **Step 1: Import dependencies**

Import `validateVisitRequest`, `toast`, `z` from `zod`.

- [ ] **Step 2: Replace manual validation**

Replace inline checks with `validateVisitRequest()` call.
Show field-specific errors via toast description or inline error state.

- [ ] **Step 3: Replace setError with toast**

Replace `setError()` with `toast.error()` for API errors and validation errors.

- [ ] **Step 4: Replace success navigation with toast**

On success, show `toast.success()` instead of immediate navigation.

- [ ] **Step 5: Delete "Simpan Draft" button**

Remove submit button at line 165.

- [ ] **Step 6: Run build and lint**

```bash
npm run lint && npm run build
```

---

### Task 4: Add `type` Attribute to All Buttons

**Files:**
- Modify: `apps/frontend/src/pages/admin/AdminLogin.tsx`
- Modify: `apps/frontend/src/components/layout/TopBar.tsx`
- Modify: `apps/frontend/src/components/shared/Sidebar.tsx`
- Modify: `apps/frontend/src/components/shared/RequestTable.tsx`
- Modify: `apps/frontend/src/pages/admin/RequestList.tsx`
- Modify: `apps/frontend/src/pages/admin/RequestDetail.tsx`
- Modify: `apps/frontend/src/pages/admin/AdminDashboard.tsx`
- Modify: `apps/frontend/src/pages/public/LandingPage.tsx`
- Modify: `apps/frontend/src/pages/public/RequestStatus.tsx`
- Modify: `apps/frontend/src/pages/public/SubmissionSuccess.tsx`

**Interfaces:**
- Consumes: none
- Produces: All buttons have explicit `type` attribute

- [ ] **Step 1: Add type to all buttons**

For each file, add `type="button"`, `type="submit"`, or `type="reset"` where missing.

- [ ] **Step 2: Run lint and build**

```bash
npm run lint && npm run build
```

---

### Task 5: Fix Requirement Icons Consistency

**Files:**
- Modify: `apps/frontend/src/pages/public/SubmissionForm.tsx`

**Interfaces:**
- Consumes: none
- Produces: Icons in "Persyaratan Kunjungan" section have consistent sizing

- [ ] **Step 1: Wrap CheckCircle2 in fixed container**

Change from `<CheckCircle2 className="mt-1 h-5 w-5 text-secondary" />` to:
```tsx
<div className="flex shrink-0 items-center justify-center h-5 w-5">
  <CheckCircle2 className="h-5 w-5 text-secondary" aria-hidden="true" />
</div>
```

Apply same pattern for all requirement items.

- [ ] **Step 2: Run lint and build**

```bash
npm run lint && npm run build
```
