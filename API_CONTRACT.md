# Si Ketuk Pintu API Contract

## Authentication

Protected endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer {token}
```

---

## Health Check Endpoints

### 1. Liveness Check
Check if the service is running.

**Endpoint:** `GET /healthz`

**Response:**
```json
{
  "status": "ok"
}
```

**Status Code:** `200 OK`

---

### 2. Readiness Check
Check if the service is ready (database connection verified).

**Endpoint:** `GET /readyz`

**Response (Success):**
```json
{
  "status": "ready"
}
```

**Response (Unavailable):**
```json
{
  "status": "unavailable"
}
```

**Status Codes:**
- `200 OK` - Service is ready
- `503 Service Unavailable` - Service dependencies are not ready

---

## Public Endpoints

### 3. Create Visit Request
Submit a new visitor request with required documents.

**Endpoint:** `POST /public/requests`

**Content-Type:** `multipart/form-data`

**Request Fields:**
| Field | Type | Required | Format | Notes |
|-------|------|----------|--------|-------|
| `email` | string | ✓ | Valid email | Visitor email |
| `nama_instansi` | string | ✓ | - | Organization name |
| `alamat_instansi` | string | ✓ | - | Organization address |
| `tanggal_kunjungan` | integer | ✓ | Unix epoch milliseconds | Visit date midnight in Asia/Makassar (UTC+8), must be future |
| `jam_kunjungan` | integer | ✓ | Unix epoch milliseconds | Visit time-of-day on 1970-01-01 in Asia/Makassar (UTC+8) |
| `tema_kunjungan` | string | ✓ | - | Visit theme/purpose |
| `pimpinan_rombongan` | string | ✓ | - | Group leader name |
| `jumlah_tamu` | integer | ✓ | Min: 1 | Number of guests |
| `kontak_dihubungi` | string | ✓ | - | Contact person name |
| `guests` | JSON array | ✓ | See below | Guest list |
| `surat_kunjungan` | file | ✓ | PDF only | Visit letter (max 5MB) |
| `surat_tugas` | file | ✓ | PDF only | Task letter (max 5MB) |

**Guests JSON Format:**
```json
[
  {
    "nama": "John Doe",
    "jabatan": "Director"
  },
  {
    "nama": "Jane Smith",
    "jabatan": "Manager"
  }
]
```

**Constraints:**
- Guest count must match `jumlah_tamu`
- PDF files must be valid
- Each file must not exceed 5MB
- `tanggal_kunjungan` and `jam_kunjungan` must be in the future
- `tanggal_kunjungan` must be midnight-aligned in Asia/Makassar (UTC+8); `jam_kunjungan` must be minute-aligned within one calendar day

**Response (Success):**
```json
{
  "token": "ABC123XYZ789ABC",
  "message": "Permintaan kunjungan berhasil dikirim. Simpan token atau QR code Anda untuk melacak status."
}
```

**Status Code:** `201 Created`

**Error Responses:**
| Status | Error | Reason |
|--------|-------|--------|
| `400 Bad Request` | Invalid format | Malformed request, invalid date/time format, missing fields |
| `422 Unprocessable Entity` | Business logic error | Guest count mismatch, invalid PDF, file size exceeds 5MB, past date/time |
| `500 Internal Server Error` | Server error | Unexpected error while processing request |

---

### 4. Get Visit Request by Token
Retrieve visitor request details using the token.

**Endpoint:** `GET /public/requests/:token`

**Rate Limited:** Yes (10 requests per second)

**Response (Success):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "ABC123XYZ789ABC",
  "email": "visitor@example.com",
  "nama_instansi": "Department of Education",
  "alamat_instansi": "123 Main St, City",
  "tanggal_kunjungan": 1786723200000,
  "jam_kunjungan": 7200000,
  "tema_kunjungan": "School Visit",
  "pimpinan_rombongan": "Dr. John Smith",
  "jumlah_tamu": 2,
  "kontak_dihubungi": "John Smith",
  "status": "pending",
  "guests": [
    {
      "guest_order": 1,
      "nama": "John Doe",
      "jabatan": "Director"
    },
    {
      "guest_order": 2,
      "nama": "Jane Smith",
      "jabatan": "Manager"
    }
  ],
  "attachments": [
    {
      "attachment_type": "surat_kunjungan",
      "original_name": "surat_kunjungan.pdf",
      "content_type": "application/pdf",
      "size_bytes": 102400
    },
    {
      "attachment_type": "surat_tugas",
      "original_name": "surat_tugas.pdf",
      "content_type": "application/pdf",
      "size_bytes": 98304
    }
  ],
  "created_at": 1786415400000,
  "updated_at": 1786415400000
}
```

**Status Code:** `200 OK`

**Error Responses:**
| Status | Error |
|--------|-------|
| `404 Not Found` | Token not found |
| `500 Internal Server Error` | Server error |

---

### 5. Download QR Code
Download the QR code for the visitor request.

**Endpoint:** `GET /public/requests/:token/qr`

**Rate Limited:** Yes (10 requests per second)

**Response:** PNG image file

**Headers:**
```
Content-Type: image/png
Content-Disposition: attachment; filename={token}.png
```

**Status Code:** `200 OK`

**Error Responses:**
| Status | Error |
|--------|-------|
| `404 Not Found` | Token not found |
| `500 Internal Server Error` | Server error |

---

### 6. Preview Attachment by Token
Preview an uploaded attachment for a visitor request (public, no auth).

**Endpoint:** `GET /public/requests/:token/attachments/:type`

**Rate Limited:** Yes (10 requests per second)

**Path Parameters:**
- `token` (string): Visit request token
- `type` (string): Attachment type (`surat_kunjungan` or `surat_tugas`)

**Response:** File (PDF)

**Headers:**
```
Content-Disposition: inline; filename={original_filename}
Content-Type: application/pdf
```

**Status Code:** `200 OK`

**Error Responses:**
| Status | Error |
|--------|-------|
| `400 Bad Request` | Invalid attachment type |
| `404 Not Found` | Token or attachment not found |
| `500 Internal Server Error` | Server error |

---

## Admin Endpoints

### 7. Admin Login
Authenticate as administrator.

**Endpoint:** `POST /admin/auth/login`

**Content-Type:** `application/json`

**Request:**
```json
{
  "identifier": "admin@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Status Code:** `200 OK`

**Error Responses:**
| Status | Error |
|--------|-------|
| `400 Bad Request` | Missing fields |
| `401 Unauthorized` | Invalid credentials |
| `500 Internal Server Error` | Server error |

---

### 8. List Visit Requests
Retrieve paginated list of visitor requests (admin only).

**Endpoint:** `GET /admin/requests`

**Authentication:** Required (Bearer token)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `page_size` | integer | 20 | Items per page |
| `search` | string | - | Search by institution name or leader name |
| `status` | string | - | Filter by status (pending, approved, rejected) |
| `date` | string | - | Filter by date (YYYY-MM-DD) |

**Response (Success):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "token": "ABC123XYZ789ABC",
      "nama_instansi": "Department of Education",
      "pimpinan_rombongan": "Dr. John Smith",
      "tanggal_kunjungan": 1786723200000,
      "jumlah_tamu": 2,
      "status": "pending",
      "created_at": 1786415400000
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "token": "XYZ789ABC123XYZ",
      "nama_instansi": "Ministry of Health",
      "pimpinan_rombongan": "Dr. Sarah Johnson",
      "tanggal_kunjungan": 1786809600000,
      "jumlah_tamu": 3,
      "status": "approved",
      "created_at": 1786342800000
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 20,
  "total_pages": 8
}
```

**Status Code:** `200 OK`

**Error Responses:**
| Status | Error |
|--------|-------|
| `401 Unauthorized` | Missing or invalid token |
| `500 Internal Server Error` | Server error |

---

### 9. Get Requests Graph
Retrieve visit request counts aggregated per period for the dashboard chart (admin only).

**Endpoint:** `GET /admin/requests/graph`

**Authentication:** Required (Bearer token)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | - | Aggregation period (`daily`, `monthly`, or `yearly`) |
| `year` | integer | 2026 | Year to aggregate |
| `month` | integer | - | Month (1-12); **required** when `period=daily` |

**Response (Success):**
```json
{
  "data": [
    {
      "period": "2026-08-01",
      "count": 5
    },
    {
      "period": "2026-08-02",
      "count": 3
    }
  ]
}
```

> `period` is a date string (`YYYY-MM-DD`) for daily/monthly points; counts are the number of requests in that bucket.

**Status Code:** `200 OK`

**Error Responses:**
| Status | Error |
|--------|-------|
| `400 Bad Request` | Invalid period or missing month (1-12) for daily period |
| `401 Unauthorized` | Missing or invalid token |
| `500 Internal Server Error` | Server error |

---

### 10. Get Visit Request Details
Retrieve detailed information about a specific visitor request (admin only).

**Endpoint:** `GET /admin/requests/:id`

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `id` (string): UUID of the visit request

**Response (Success):**
```json
{
  "request": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "token": "ABC123XYZ789ABC",
    "email": "visitor@example.com",
    "nama_instansi": "Department of Education",
    "alamat_instansi": "123 Main St, City",
    "tanggal_kunjungan": 1786723200000,
    "jam_kunjungan": 7200000,
    "tema_kunjungan": "School Visit",
    "pimpinan_rombongan": "Dr. John Smith",
    "jumlah_tamu": 2,
    "kontak_dihubungi": "John Smith",
    "status": "pending",
    "guests": [
      {
        "guest_order": 1,
        "nama": "John Doe",
        "jabatan": "Director"
      },
      {
        "guest_order": 2,
        "nama": "Jane Smith",
        "jabatan": "Manager"
      }
    ],
    "attachments": [
      {
        "attachment_type": "surat_kunjungan",
        "original_name": "surat_kunjungan.pdf",
        "content_type": "application/pdf",
        "size_bytes": 102400
      },
      {
        "attachment_type": "surat_tugas",
        "original_name": "surat_tugas.pdf",
        "content_type": "application/pdf",
        "size_bytes": 98304
      }
    ],
    "created_at": 1786415400000,
    "updated_at": 1786415400000
  },
  "audit_events": [
    {
      "id": 1,
      "actor_type": "system",
      "action": "created",
      "previous_value": null,
      "new_value": {
        "status": "pending"
      },
      "occurred_at": 1786415400000
    }
  ]
}
```

**Status Code:** `200 OK`

**Error Responses:**
| Status | Error |
|--------|-------|
| `400 Bad Request` | Invalid UUID format |
| `401 Unauthorized` | Missing or invalid token |
| `404 Not Found` | Request not found |
| `500 Internal Server Error` | Server error |

---

### 11. Update Visit Request Status
Update the status of a visitor request (admin only).

**Endpoint:** `PATCH /admin/requests/:id/status`

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `id` (string): UUID of the visit request

**Request:**
```json
{
  "status": "approved"
}
```

**Status Values:**
- `pending` - Initial state
- `approved` - Request approved
- `rejected` - Request rejected

**Response (Success):**
```json
{
  "message": "status updated"
}
```

**Status Code:** `200 OK`

**Error Responses:**
| Status | Error |
|--------|-------|
| `400 Bad Request` | Invalid UUID format or invalid status value |
| `401 Unauthorized` | Missing or invalid token |
| `404 Not Found` | Request not found |
| `500 Internal Server Error` | Server error |

---

### 12. Download Attachment
Download a specific attachment file (admin only).

**Endpoint:** `GET /admin/requests/:id/attachments/:type`

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `id` (string): UUID of the visit request
- `type` (string): Attachment type (`surat_kunjungan` or `surat_tugas`)

**Response:** File (PDF)

> Used for browser preview in the admin dashboard; the same endpoint returns the file binary and the frontend opens it in a new tab via `URL.createObjectURL`.

**Headers:**
```
Content-Disposition: attachment; filename={original_filename}
Content-Type: application/pdf
```

**Status Code:** `200 OK`

**Error Responses:**
| Status | Error |
|--------|-------|
| `400 Bad Request` | Invalid UUID format or invalid attachment type |
| `401 Unauthorized` | Missing or invalid token |
| `404 Not Found` | Request or attachment not found |
| `500 Internal Server Error` | Server error |

---

### 13. List Archives
Retrieve a paginated list of **approved** visit requests only (admin only). The status filter is forced to `approved` server-side and cannot be overridden by the client.

**Endpoint:** `GET /admin/archives`

**Authentication:** Required (Bearer token)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `page_size` | integer | 20 | Items per page |
| `search` | string | - | Search by institution name or leader name |
| `date` | string | - | Filter by date (YYYY-MM-DD) |

The response shape is identical to `GET /admin/requests`, with every row's `status` equal to `"approved"`.

---

### 14. Upload Documentation Images
Upload one or more documentation images for an approved request (admin only).

**Endpoint:** `POST /admin/archives/:id/documentations`

**Authentication:** Required (Bearer token)

**Content-Type:** `multipart/form-data`

**Request Fields:**
| Field | Type | Required | Format | Notes |
|-------|------|----------|--------|-------|
| `files` | file[] | ✓ | PNG/JPG/JPEG only, repeatable field | Each file max 5MB; total of all `images` attachments per request max 10MB |

Stored with `attachment_type = "images"`; multiple rows per request are allowed.

**Response (Success):**
```json
{
  "attachments": [
    {
      "id": 12,
      "attachment_type": "images",
      "original_name": "dokumentasi-1.png",
      "content_type": "image/png",
      "size_bytes": 204800
    }
  ]
}
```

**Status Code:** `201 Created`

**Error Responses:**
| Status | Error |
|--------|-------|
| `400 Bad Request` | Missing/invalid files, unsupported extension, invalid image content, file over 5MB, total over 10MB |
| `401 Unauthorized` | Missing or invalid token |
| `404 Not Found` | Request not found |
| `409 Conflict` | Request is not approved |
| `500 Internal Server Error` | Server error |

---

### 15. Delete Documentation Image
Delete one documentation image by attachment ID (admin only).

**Endpoint:** `DELETE /admin/archives/:id/documentations/:attachment_id`

**Authentication:** Required (Bearer token)

**Response (Success):**
```json
{
  "message": "documentation image deleted"
}
```

**Status Code:** `200 OK`

**Error Responses:**
| Status | Error |
|--------|-------|
| `400 Bad Request` | Invalid UUID/attachment ID |
| `401 Unauthorized` | Missing or invalid token |
| `404 Not Found` | Attachment not found for this request |
| `500 Internal Server Error` | Server error |

---

### 16. Upload Attendance List (Daftar Absen)
Upload the single attendance-list PDF for an approved request (admin only).

**Endpoint:** `POST /admin/archives/:id/daftar-absen`

**Authentication:** Required (Bearer token)

**Content-Type:** `multipart/form-data`

**Request Fields:**
| Field | Type | Required | Format | Notes |
|-------|------|----------|--------|-------|
| `file` | file | ✓ | PDF only, max 5MB | One file per request (`attachment_type = "daftar_absen"`) |

**Response (Success):**
```json
{
  "attachment": {
    "id": 13,
    "attachment_type": "daftar_absen",
    "original_name": "daftar_absen.pdf",
    "content_type": "application/pdf",
    "size_bytes": 51200
  }
}
```

**Status Code:** `201 Created`

**Error Responses:**
| Status | Error |
|--------|-------|
| `400 Bad Request` | Missing file, invalid PDF, file over 5MB |
| `401 Unauthorized` | Missing or invalid token |
| `404 Not Found` | Request not found |
| `409 Conflict` | Request not approved, or attendance list already exists |
| `500 Internal Server Error` | Server error |

---

### 17. Delete Attendance List
Delete the attendance-list PDF of a request (admin only).

**Endpoint:** `DELETE /admin/archives/:id/daftar-absen`

**Authentication:** Required (Bearer token)

**Response (Success):**
```json
{
  "message": "attendance list deleted"
}
```

**Status Code:** `200 OK`

**Error Responses:**
| Status | Error |
|--------|-------|
| `400 Bad Request` | Invalid UUID |
| `401 Unauthorized` | Missing or invalid token |
| `404 Not Found` | Attendance list not found |
| `500 Internal Server Error` | Server error |

---

### 18. Download Archive Attachment
Download an archive attachment (documentation image or attendance list) by attachment ID (admin only).

**Endpoint:** `GET /admin/archives/:id/attachments/:attachment_type/:attachment_id`

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `id` (string): UUID of the visit request
- `attachment_type` (string): `images` or `daftar_absen`
- `attachment_id` (integer): Numeric attachment ID owned by this request

**Response:** File binary (`image/png`, `image/jpeg`, or `application/pdf` from stored metadata)

**Headers:**
```
Content-Disposition: attachment; filename="{original_filename}"
Content-Type: {stored_content_type}
```

**Status Code:** `200 OK`

**Error Responses:**
| Status | Error |
|--------|-------|
| `400 Bad Request` | Invalid UUID/attachment ID/type |
| `401 Unauthorized` | Missing or invalid token |
| `404 Not Found` | Request or attachment not found, or type mismatch |
| `409 Conflict` | Request is not approved |
| `500 Internal Server Error` | Server error |

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error description"
}
```

---

## Status Codes Summary

| Code | Meaning |
|------|---------|
| `200` | OK - Request succeeded |
| `201` | Created - Resource created successfully |
| `400` | Bad Request - Invalid request format or parameters |
| `401` | Unauthorized - Missing or invalid authentication |
| `404` | Not Found - Resource not found |
| `422` | Unprocessable Entity - Request validation failed |
| `500` | Internal Server Error - Server-side error |
| `503` | Service Unavailable - Dependencies not ready |

---

## CORS

The API supports CORS with the following allowed origins (configurable):

By default, the following origins are allowed:
- `http://localhost:3000`
- `http://localhost:5173`

**Allowed Methods:** `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`

**Allowed Headers:** `Origin`, `Content-Type`, `Authorization`

---

## Rate Limiting

Public endpoints with rate limiting:
- `GET /public/requests/:token` - 10 requests per second
- `GET /public/requests/:token/attachments/:type` - 10 requests per second
- `GET /public/requests/:token/qr` - 10 requests per second

Rate limit exceeded responses: `429 Too Many Requests`

---

## Date and Time Format

- **Unit:** all temporal values are Unix epoch milliseconds (JSON numbers).
- **`tanggal_kunjungan`:** epoch milliseconds of the visit-date midnight in Asia/Makassar (UTC+8), e.g. `1786723200000` = 2026-08-15 00:00 WITA.
- **`jam_kunjungan`:** epoch milliseconds of the visit time-of-day on 1970-01-01 in Asia/Makassar (UTC+8), e.g. `7200000` = 10:00 WITA.
- **`created_at` / `updated_at` / `occurred_at`:** epoch milliseconds of the actual instant.
- **Timezone:** Asia/Makassar (UTC+8). The backend stores and returns numbers only; clients own display timezone and formatting.
- **Graph `period`** remains a calendar label string (`YYYY-MM-DD`) in Asia/Makassar.
- **List `date` filter query parameter** remains a calendar date string (`YYYY-MM-DD`).
