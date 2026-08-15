# Dashboard Layout Refactor Design

## Scope

Restructure frontend routing so public pages and dashboard pages each use a dedicated layout via React Router nested routes and `Outlet`. Add a shadcn-style dashboard layout with collapsible sidebar, page title from path, and logout.

## Routing

Replace conditional layout logic in `Layout.tsx` with nested route layouts:

- Public routes (landing, submit, status, success) render inside `LandingLayout` with TopBar and Footer.
- Admin login renders standalone (no layout).
- Dashboard routes (`/dashboard`, `/dashboard/requests`, `/dashboard/requests/:id`) render inside `DashboardLayout`.

No page decides layout from `pathname`. Each layout owns its chrome and renders children via `<Outlet />`.

## File changes

- Rename `apps/frontend/src/components/layout/Layout.tsx` to `LandingLayout.tsx`; remove `useLocation` and the `isAdminRoute` branch. Keep `children` via `Outlet`.
- Create `apps/frontend/src/components/layout/DashboardLayout.tsx` with:
  - Shadcn `dashboard-01`/`sidebar-07`-style sidebar and top nav.
  - Sidebar collapse button; collapse uses motion for smooth width transition.
  - Mobile: sidebar becomes drawer with overlay and menu button in nav.
  - Nav item labels: Dashboard, Manajemen Permohonan. Page title in nav derives from current path.
  - Logout button; clears JWT and navigates to `/` (reusing `logout()` from `lib/api/auth.ts`).
- Delete `apps/frontend/src/components/shared/Sidebar.tsx`.
- Update `app.tsx` to route-based layout.

## Page titles

Derived from `useLocation().pathname` in `DashboardLayout`:

- `/dashboard` -> Dashboard
- `/dashboard/requests` -> Manajemen Permohonan
- `/dashboard/requests/:id` -> Detail Permohonan

## Page cleanup

Remove embedded `<Sidebar />` and outer `flex min-h-screen bg-background` wrappers from:

- `pages/admin/AdminDashboard.tsx`
- `pages/admin/RequestList.tsx`
- `pages/admin/RequestDetail.tsx` (including its loading branch)

Each page renders only its own content; layout provides chrome.

## Dependencies

- Reuse `motion` (already installed), `lucide-react` (already installed).
- No new packages, no shadcn/ui install.

## Validation

- `npm --prefix apps/frontend run lint`
- `npm --prefix apps/frontend run build`
- Manual check: public pages keep TopBar/Footer; dashboard pages show sidebar + nav; collapse and drawer work; logout clears token and returns to landing.
