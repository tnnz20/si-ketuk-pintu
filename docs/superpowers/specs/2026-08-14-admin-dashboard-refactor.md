# Admin Dashboard Refactor Specification

**Date:** 2026-08-14  
**Status:** Approved  
**Scope:** Route restructure, stats cards, QR scanner, request management redesign, delete functionality

---

## Overview

Refactor admin interface to move routes from `/admin/*` → `/dashboard/*`, add statistics endpoints, implement QR scanner for request lookup, redesign request management with full CRUD operations, and localize all content to Bahasa Indonesia.

---

## Routing Changes

### Frontend Routes
- `/admin/login` → unchanged (entry point)
- `/admin` → `/dashboard`
- `/admin/requests` → `/dashboard/requests`
- `/admin/requests/:id` → `/dashboard/requests/:id`

### Backend Routes (New)
- `GET /admin/stats` — returns daily, pending, total request counts
- `DELETE /admin/requests/:id` — delete request with cascading deletes

---

## Dashboard Page (`/dashboard`)

### Components
1. **Header** — "Selamat datang kembali, Admin" + tagline
2. **Stats Cards** (3 cards, skeleton on load)
   - "Permohonan Hari Ini" (count from `created_at` = today)
   - "Menunggu Persetujuan" (status = pending)
   - "Total Permohonan" (all records)
   - Each card shows value + trend indicator
3. **QR Scanner** — modal/card with:
   - Camera input (html5-qrcode library or BarcodeDetector)
   - Token manual input fallback
   - Valid token → navigate `/dashboard/requests/:id`
   - Invalid token → show "Kode QR tidak valid" message
4. **Recent Requests Table** — last 10 requests, footer link to view all

### Data Flow
- Fetch `/admin/stats` on mount
- Fetch `/admin/requests?page=1&page_size=10` on mount
- Scanner: fetch `/public/requests/:token` to validate, then redirect

---

## Request Management Page (`/dashboard/requests`)

### Features
1. **Search & Filters**
   - Search by Token (ILIKE)
   - Filter by Status (pending/approved/rejected)
   - Filter by Date (tanggal_kunjungan)

2. **Table Columns**
   - Token
   - Nama Instansi
   - Tanggal Kunjungan
   - Pimpinan Rombongan (truncate if >30 chars)
   - Jumlah Tamu
   - Status (badge)
   - Dibuat Pada

3. **Row Actions** — dropdown menu
   - "Lihat Detail" → navigate to `/dashboard/requests/:id`
   - "Ubah Status" → confirmation dialog + toast
   - "Hapus" → confirmation dialog + delete + toast

4. **Scanner Button** — top-right, opens same scanner as dashboard

5. **Loading State** — skeleton rows

---

## Request Detail Page (`/dashboard/requests/:id`)

### Sections
1. **Header** — token, tema, nama instansi, visit date/time, status badge
2. **Purpose of Visit** — tema_kunjungan full text
3. **Guest List** — all guests with nama, jabatan
4. **Attached Documents** — surat_kunjungan, surat_tugas with download buttons
5. **Audit History** — timeline of actions (created, status changes)
6. **Admin Actions** (sticky sidebar)
   - Current status display
   - "Setujui Permohonan" button
   - "Tolak Permohonan" button
   - Both trigger confirmation dialog + update via PATCH + toast

7. **Loading State** — skeleton for all sections

---

## Components (New/Reusable)

### QR Scanner (`<QRScanner />`)
Props: `onSuccess(token: string)`, `onError(msg: string)`
- Camera input with fallback text input
- Validates token format (SKP-YYYYMMDD-XXXXX)
- Shows success/error states

### Confirmation Dialog (`<ConfirmDialog />`)
Props: `title`, `description`, `action` (approve/reject/delete), `onConfirm`, `onCancel`, `loading`
- Modal overlay with backdrop blur
- Displays title, description, action buttons
- Loading state disables buttons

### Skeleton Loader (`<Skeleton />`)
Props: `className`
- Shimmer animation via Tailwind keyframes
- Generic placeholder for cards, table rows

### Stats Card (`<StatsCard />`)
Props: `label`, `value`, `trend`, `loading`
- Shows label, value, trend indicator
- Loading: skeleton

### Request Table (`<RequestTable />`)
Props: `requests`, `onRowClick`, `onAction` (menu), `loading`
- Columns: Token, Nama Instansi, Tanggal Kunjungan, Pimpinan Rombongan (truncate), Jumlah Tamu, Status, Dibuat Pada
- Action dropdown per row

---

## Backend Endpoints (New)

### GET /admin/stats
**Protected:** Yes (Bearer token)

**Response:**
```json
{
  "today_requests": 5,
  "pending_approval": 12,
  "total_requests": 287
}
```

**Logic:**
- `today_requests`: `created_at` = today (in admin's timezone)
- `pending_approval`: status = 'pending'
- `total_requests`: all records

---

### DELETE /admin/requests/:id
**Protected:** Yes (Bearer token)

**Response:** `{ "message": "Permohonan berhasil dihapus" }`

**Logic:**
- Delete visit_request + cascading guests, attachments, audit_events
- Log deletion to audit
- Return 200 on success, 404 if not found

---

## API Client Updates

### New Functions
- `getStats(): Promise<StatsResponse>`
- `deleteRequest(id: string): Promise<{ message: string }>`

### Updated Functions
- `getRequests()` — response includes `pimpinan_rombongan`, `jam_kunjungan` (already in paginated response)

---

## Sidebar Navigation

**Menu Items:**
1. Dashboard → `/dashboard`
2. Manajemen Permohonan → `/dashboard/requests`

(Remove QR Scanner, Settings menu items)

---

## Localization (Bahasa Indonesia)

**Key Terms:**
- "Selamat datang kembali, Admin" (Welcome back, Admin)
- "Permohonan Hari Ini" (Today's Requests)
- "Menunggu Persetujuan" (Pending Approval)
- "Total Permohonan" (Total Requests)
- "Manajemen Permohonan" (Request Management)
- "Cari permohonan berdasarkan token" (Search by token)
- "Lihat Detail" (View Detail)
- "Ubah Status" (Change Status)
- "Hapus" (Delete)
- "Setujui Permohonan" (Approve Request)
- "Tolak Permohonan" (Reject Request)
- "Kode QR tidak valid" (Invalid QR Code)
- Toast: "Permohonan berhasil diperbarui" (Request updated successfully)
- Toast: "Permohonan berhasil dihapus" (Request deleted successfully)
- Dialog: "Apakah Anda yakin?" (Are you sure?)

---

## Dependencies

- `html5-qrcode` (v2.3.0+) — QR scanning
- `sonner` — already installed for toasts
- No shadcn components; use native `<dialog>` + Tailwind

---

## Testing Strategy

1. **Backend**
   - `/admin/stats` returns correct counts
   - `DELETE /admin/requests/:id` cascades correctly
   - Audit logged for deletions

2. **Frontend**
   - Routes redirect correctly
   - Scanner validates tokens, navigates on success
   - Dialogs confirm before actions
   - Toasts show success/failure
   - Tables load and filter correctly
   - Skeleton states render during loading

---

## Acceptance Criteria

- ✓ All routes migrated to `/dashboard`
- ✓ Stats cards display with correct data + skeleton loading
- ✓ QR scanner works (camera or fallback input)
- ✓ Request table displays full columns with truncation
- ✓ Row actions (detail, update status, delete) functional
- ✓ Confirmation dialogs and toasts work
- ✓ All UI text in Bahasa Indonesia
- ✓ Sidebar shows only Dashboard and Manajemen Permohonan
- ✓ Detail page shows all fields, audit history, document downloads
- ✓ Delete cascades correctly and shows confirmation
