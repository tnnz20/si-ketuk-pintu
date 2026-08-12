# Stitch to React Conversion Implementation Plan

> **For agentic workers:** Use subagent-driven-development to execute tasks.

**Goal:** Convert 8 static HTML screens from Google Stitch export into a modular React application with full API integration for the "Si Ketuk Pintu" visitor management system.

**Architecture:** Break monolithic HTML into reusable components (Layout, TopBar, Footer, Sidebar, RequestTable, StatusBadge, Button, Input, Card, DocumentUpload). Create API client layer with TypeScript types matching API_CONTRACT.md. Implement routes for all 8 screens with proper state management for forms, lists, and detail views.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, React Router v7, Lucide React icons.

## Global Constraints

- Use existing project structure: `apps/frontend/src/`
- Follow DESIGN.md design tokens from `stitch-export/stitch_perk_inspired_rewards_website/civic_gateway/DESIGN.md`
- Match API_CONTRACT.md TypeScript interfaces exactly
- Use plus-jakarta-sans for headlines, public-sans for body
- Support responsive: mobile-first with lg: breakpoints at 1200px
- No external icons library other than lucide-react (already installed)
- Build must pass: `npm run build` and `npm run lint`

---

## Task 1: Design Tokens & Shared Layout

**Files:**
- Create: `apps/frontend/src/index.css` (refactored from DESIGN.md tokens)
- Create: `apps/frontend/src/components/layout/Layout.tsx`
- Create: `apps/frontend/src/components/layout/TopBar.tsx`
- Create: `apps/frontend/src/components/layout/Footer.tsx`
- Modify: `apps/frontend/src/app.tsx` (add router structure)

**Interfaces:**
- Consumes: none
- Produces: Layout wrapper, TopBar with navigation, Footer, design tokens

- [ ] **Step 1: Refactor index.css with DESIGN.md tokens**

Read DESIGN.md, update `src/index.css` with:
- All 54 color tokens from DESIGN.md (primary, secondary, tertiary, surface variants, status colors)
- Typography scale: display, headline-lg, headline-lg-mobile, headline-md, body-lg, body-md, label-md, label-sm
- Roundness: sm (0.125rem), DEFAULT (0.25rem), md (0.375rem), lg (0.5rem), xl (0.75rem), full (9999px)
- Spacing: unit (8px), container-max (1200px), gutter (24px), margin-mobile (16px), margin-desktop (40px)
- Keep dark mode theme

- [ ] **Step 2: Create Layout component**

Wrapper component with Footer, main content area, and responsive padding/margin.

- [ ] **Step 3: Create TopBar component**

Fixed header with logo, navigation links (Process, Status Check), Admin Login button, user avatar. Mobile menu toggle.

- [ ] **Step 4: Create Footer component**

Brand, copyright, links: Privacy Policy, Terms of Service, Contact Support, Accessibility.

- [ ] **Step 5: Update app.tsx with router**

Add `react-router-dom` Routes for all 8 screens:
- `/` → LandingPage
- `/submit` → SubmissionForm
- `/status/:token` → RequestStatus
- `/success` → SubmissionSuccess
- `/admin/login` → AdminLogin
- `/admin` → AdminDashboard
- `/admin/requests` → RequestList
- `/admin/requests/:id` → RequestDetail

- [ ] **Step 6: Run build**

```bash
cd apps/frontend && npm run build
```

---

## Task 2: Public Pages (Landing, Submit, Success, Status)

**Files:**
- Create: `apps/frontend/src/pages/public/LandingPage.tsx`
- Create: `apps/frontend/src/pages/public/SubmissionForm.tsx`
- Create: `apps/frontend/src/pages/public/SubmissionSuccess.tsx`
- Create: `apps/frontend/src/pages/public/RequestStatus.tsx`

**Interfaces:**
- Consumes: Layout, TopBar, Footer from Task 1
- Produces: Public route pages with form state, token display, status badges

- [ ] **Step 1: Create LandingPage**

Hero section with title, description, CTA buttons (Ajukan Kunjungan, Check Status). Process section with 3 steps (Submit Request, Review & Approval, Visit). Status check bento card.

- [ ] **Step 2: Create SubmissionForm**

Multi-section form with:
- Contact & Institution (email, nama_instansi, alamat_instansi)
- Visit Details (tanggal_kunjungan, jam_kunjungan, tema_kunjungan)
- Rombongan Info (pimpinan_rombongan, kontak_dihubungi, jumlah_tamu)
- Guest List (dynamic rows with add/delete)
- Documents (Surat Kunjungan, Surat Tugas upload)

Form state management for guest rows and file inputs.

- [ ] **Step 3: Create SubmissionSuccess**

Token display with copy button, QR code placeholder, Download QR button, Return to Home link. Success icon and copy token JS logic.

- [ ] **Step 4: Create RequestStatus**

Token header with status badge, Request Details card (date, time, organization, purpose, target), Guest List table, Documents sidebar (PDF links with download), Support box with Contact Support button.

- [ ] **Step 5: Run build**

```bash
cd apps/frontend && npm run build
```

---

## Task 3: Admin Pages (Login, Dashboard, List, Detail)

**Files:**
- Create: `apps/frontend/src/pages/admin/AdminLogin.tsx`
- Create: `apps/frontend/src/pages/admin/AdminDashboard.tsx`
- Create: `apps/frontend/src/pages/admin/RequestList.tsx`
- Create: `apps/frontend/src/pages/admin/RequestDetail.tsx`
- Create: `apps/frontend/src/components/shared/Sidebar.tsx`
- Create: `apps/frontend/src/components/shared/RequestTable.tsx`
- Create: `apps/frontend/src/components/shared/StatusBadge.tsx`

**Interfaces:**
- Consumes: Layout, TopBar, Footer from Task 1
- Produces: Admin route pages with auth state, dashboard metrics, request tables

- [ ] **Step 1: Create AdminLogin**

Email/username field, password field with visibility toggle, Forgot Password link, Login button with icon.

- [ ] **Step 2: Create Sidebar component**

Persistent left sidebar with Dashboard, Request Management, QR Scanner, Settings nav links. Active state styles. Logout button.

- [ ] **Step 3: Create AdminDashboard**

Welcome header, 3 metric cards (Total Requests, Pending Approval, Active QR Codes), Recent Requests table, Decorative visual context cards (System Infrastructure, Security Analytics).

- [ ] **Step 4: Create RequestTable component**

Reusable table for admin list view with columns: Date, ID, User, Status, Actions (menu button).

- [ ] **Step 5: Create StatusBadge component**

Stateless component rendering status chips (Pending, Approved, Rejected) with colors.

- [ ] **Step 6: Create RequestList page**

Protected admin route with table header, filters (search, status, date), pagination, Recent Requests data.

- [ ] **Step 7: Create RequestDetail page**

Back button, Request Info header, Description, Guest List, Audit History Timeline, Status Management Panel (Approve, Request Revision, Reject buttons), Attached Documents sidebar.

- [ ] **Step 8: Run build**

```bash
cd apps/frontend && npm run build
```

---

## Task 4: API Client & Types

**Files:**
- Create: `apps/frontend/src/lib/api/client.ts`
- Create: `apps/frontend/src/lib/api/auth.ts`
- Create: `apps/frontend/src/lib/api/requests.ts`
- Create: `apps/frontend/src/lib/types/api.ts`

**Interfaces:**
- Consumes: none
- Produces: Typed API client with JWT auth and request CRUD

- [ ] **Step 1: Create api.ts types**

Full TypeScript interfaces matching API_CONTRACT.md:
- `VisitRequest`, `Guest`, `Attachment`, `AuditEvent`
- `CreateVisitRequestData`, `UpdateStatusRequest`
- `PaginatedRequestsResponse`, `RequestDetailResponse`
- `LoginResponse`, `ErrorResponse`

- [ ] **Step 2: Create client.ts**

Axios instance with:
- Base URL from `VITE_API_URL`
- Default headers (Content-Type, Authorization via Bearer token)
- Error interceptor returning consistent format

- [ ] **Step 3: Create auth.ts**

`login(identifier: string, password: string): Promise<string>` → returns JWT token, store in `localStorage`

- [ ] **Step 4: Create requests.ts**

Functions:
- `getRequests(page: number, pageSize: number, filters?: object): Promise<PaginatedRequestsResponse>`
- `getRequestById(id: string): Promise<RequestDetailResponse>`
- `getRequestByToken(token: string): Promise<VisitRequest>`
- `updateStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<void>`
- `downloadQR(token: string): Promise<Blob>`
- `downloadAttachment(id: string, type: 'surat_kunjungan' | 'surat_tugas'): Promise<Blob>`

- [ ] **Step 5: Run build**

```bash
cd apps/frontend && npm run build
```

---

## Task 5: Wire Public Pages to API

**Files:**
- Modify: `apps/frontend/src/pages/public/SubmissionForm.tsx`
- Modify: `apps/frontend/src/pages/public/RequestStatus.tsx`
- Modify: `apps/frontend/src/pages/public/SubmissionSuccess.tsx`

**Interfaces:**
- Consumes: API client from Task 4
- Produces: Pages with data fetching, loading states, error handling

- [ ] **Step 1: Wire SubmissionForm**

On submit, call `createVisitRequest()` with form data. Show success message with token, redirect to `/success`.

- [ ] **Step 2: Wire RequestStatus**

Fetch by token, show loading skeleton, display request details, guest list, documents. Handle 404 error.

- [ ] **Step 3: Wire SubmissionSuccess**

Display token from route state or URL params. Generate/download QR via `downloadQR()`.

- [ ] **Step 4: Run build**

```bash
cd apps/frontend && npm run build
```

---

## Task 6: Wire Admin Pages to API

**Files:**
- Modify: `apps/frontend/src/pages/admin/AdminDashboard.tsx`
- Modify: `apps/frontend/src/pages/admin/RequestList.tsx`
- Modify: `apps/frontend/src/pages/admin/RequestDetail.tsx`

**Interfaces:**
- Consumes: API client from Task 4
- Produces: Admin pages with authenticated data fetching

- [ ] **Step 1: Wire AdminDashboard**

Fetch metrics and recent requests. Show loading skeletons. Display dashboard data.

- [ ] **Step 2: Wire RequestList**

Protected route with auth guard, fetch paginated requests with filters. Display table with status badges.

- [ ] **Step 3: Wire RequestDetail**

Fetch request by ID, display all details, audit history. Status management buttons call `updateStatus()`.

- [ ] **Step 4: Run build**

```bash
cd apps/frontend && npm run build
```

---

## Task 7: Lint & Final

**Files:**
- Run: `apps/frontend/src/**/*.{ts,tsx}`

- [ ] **Step 1: Run lint**

```bash
cd apps/frontend && npm run lint
```

Fix all errors.

- [ ] **Step 2: Final build**

```bash
cd apps/frontend && npm run build
```

Confirm build succeeds with no warnings.

---

## Verification Checklist

- [ ] All 8 routes render without 404
- [ ] DESIGN.md colors/typography applied in index.css
- [ ] Responsive: mobile menu works, desktop layout stable
- [ ] Form validation: required fields, file size checks (5MB), future date checks
- [ ] API calls: success/error states, loading indicators, JWT auth
- [ ] Lint: no errors
- [ ] Build: no warnings
