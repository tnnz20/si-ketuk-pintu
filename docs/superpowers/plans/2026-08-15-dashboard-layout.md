# Dashboard Layout Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move layout selection to React Router nested routes, rename the public layout to `LandingLayout`, and add a collapsible shadcn-style `DashboardLayout` for all dashboard routes.

**Architecture:** Layouts render children via `Outlet`. `DashboardLayout` owns sidebar + nav; admin pages render only their content. No new dependencies.

**Tech Stack:** React 19, React Router v7, Tailwind v4, motion, lucide-react.

## Global Constraints

- No new packages; no shadcn/ui install.
- Logout must call `logout()` from `lib/api/auth.ts` then navigate to `/`.
- Page titles: `/dashboard` -> Dashboard, `/dashboard/requests` -> Manajemen Permohonan, `/dashboard/requests/:id` -> Detail Permohonan.
- Mobile sidebar = drawer with overlay; desktop collapse = animated width change via motion.
- Run `npm --prefix apps/frontend run prettier` after code changes, then `lint` and `build` must pass.

---

### Task 1: LandingLayout + route nesting

**Files:**
- Rename: `apps/frontend/src/components/layout/Layout.tsx` -> `LandingLayout.tsx`
- Modify: `apps/frontend/src/app.tsx`

- [ ] **Step 1:** Rename the file and change it to a route layout:

```tsx
import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import TopBar from './TopBar';

export default function LandingLayout() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <TopBar />
      <main className="pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
```

Drop `useLocation`, `isAdminRoute`, and the props type.

- [ ] **Step 2:** Update `app.tsx` to nested routes (remove `Layout` wrapper, import `LandingLayout`):

```tsx
<BrowserRouter>
  <Routes>
    <Route element={<LandingLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/submit" element={<SubmissionForm />} />
      <Route path="/status/:token" element={<RequestStatus />} />
      <Route path="/success" element={<SubmissionSuccess />} />
    </Route>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/dashboard" element={<AdminDashboard />} />
    <Route path="/dashboard/requests" element={<RequestList />} />
    <Route path="/dashboard/requests/:id" element={<RequestDetail />} />
  </Routes>
  <Toaster position="top-right" richColors />
</BrowserRouter>
```

- [ ] **Step 3:** `npm --prefix apps/frontend run lint` and `build` — both pass (dashboard still shows old sidebar inline at this stage; that's expected).

---

### Task 2: DashboardLayout

**Files:**
- Create: `apps/frontend/src/components/layout/DashboardLayout.tsx`

- [ ] **Step 1:** Create the layout. Requirements (implement, no placeholders):

- Desktop sidebar: fixed left, width animated between `w-64` and `w-20` using `motion.div` (`animate={{ width }}`, `transition={{ type: 'spring' }}` or `tween`). Collapse toggle button (chevron icon). Collapsed shows icons only.
- Sidebar header: logo image `/assets/logo.webp`, "Portal Admin" label (hidden when collapsed).
- Nav links: Dashboard (`/dashboard`, `LayoutDashboard` icon), Manajemen Permohonan (`/dashboard/requests`, `FileText` icon). Active state via `useLocation().pathname` (prefix match for `/dashboard/requests` so detail stays active; exact for `/dashboard`).
- Top nav bar inside content area: menu button (mobile only, opens drawer), page title from pathname map, logout button (`LogOut` icon) calling `logout()` then `navigate('/')`.
- Mobile: sidebar rendered as overlay drawer via `AnimatePresence` (slide in from left), backdrop closes it; hidden on `md:` desktop breakpoints.
- Content: `<div className="flex min-h-dvh bg-background">` wrapper, main area `flex-1 overflow-y-auto`, pages render through `<Outlet />`.
- Page title map in a small const:

```tsx
const titles: [RegExp, string][] = [
  [/^\/dashboard$/, 'Dashboard'],
  [/^\/dashboard\/requests$/, 'Manajemen Permohonan'],
  [/^\/dashboard\/requests\/.+/, 'Detail Permohonan'],
];
```

- [ ] **Step 2:** Wire into `app.tsx`: replace the three flat dashboard routes with:

```tsx
<Route element={<DashboardLayout />}>
  <Route path="/dashboard" element={<AdminDashboard />} />
  <Route path="/dashboard/requests" element={<RequestList />} />
  <Route path="/dashboard/requests/:id" element={<RequestDetail />} />
</Route>
```

Import `DashboardLayout`.

---

### Task 3: Strip old Sidebar from pages

**Files:**
- Modify: `apps/frontend/src/pages/admin/AdminDashboard.tsx`
- Modify: `apps/frontend/src/pages/admin/RequestList.tsx`
- Modify: `apps/frontend/src/pages/admin/RequestDetail.tsx`
- Delete: `apps/frontend/src/components/shared/Sidebar.tsx`

- [ ] **Step 1:** `AdminDashboard.tsx`: remove `Sidebar` import and `<Sidebar />`; change root to the inner content only: keep the `mx-auto max-w-container-max p-8 lg:p-10` div as the root element of the page (drop the outer `flex min-h-screen bg-background` and `<main>` wrapper, since layout provides it).

- [ ] **Step 2:** `RequestList.tsx`: same — remove `Sidebar` import/usage; root becomes the `mx-auto max-w-container-max` content div; move `ConfirmDialog` to remain inside the fragment/root.

- [ ] **Step 3:** `RequestDetail.tsx`: same for main return and loading branch (loading: just `<Skeleton className="h-40 w-full" />` inside a padded div); not-found branch unchanged.

- [ ] **Step 4:** Delete `components/shared/Sidebar.tsx`.

---

### Task 4: Format + verify

- [ ] **Step 1:** `npm --prefix apps/frontend run prettier`
- [ ] **Step 2:** `npm --prefix apps/frontend run lint` — pass
- [ ] **Step 3:** `npm --prefix apps/frontend run build` — pass
- [ ] **Step 4:** Grep to confirm no remaining `shared/Sidebar` or `layout/Layout` imports.
