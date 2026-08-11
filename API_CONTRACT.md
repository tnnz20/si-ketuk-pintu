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
| `tanggal_kunjungan` | string | ✓ | `YYYY-MM-DD` | Visit date (must be future) |
| `jam_kunjungan` | string | ✓ | `HH:MM` | Visit time (24-hour format) |
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
  "tanggal_kunjungan": "2026-08-15",
  "jam_kunjungan": "10:00",
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
  "created_at": "2026-08-11T10:30:00Z",
  "updated_at": "2026-08-11T10:30:00Z"
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

## Admin Endpoints

### 6. Admin Login
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

### 7. List Visit Requests
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
      "tanggal_kunjungan": "2026-08-15",
      "jumlah_tamu": 2,
      "status": "pending",
      "created_at": "2026-08-11T10:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "token": "XYZ789ABC123XYZ",
      "nama_instansi": "Ministry of Health",
      "pimpinan_rombongan": "Dr. Sarah Johnson",
      "tanggal_kunjungan": "2026-08-16",
      "jumlah_tamu": 3,
      "status": "approved",
      "created_at": "2026-08-10T14:20:00Z"
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

### 8. Get Visit Request Details
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
    "tanggal_kunjungan": "2026-08-15",
    "jam_kunjungan": "10:00",
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
    "created_at": "2026-08-11T10:30:00Z",
    "updated_at": "2026-08-11T10:30:00Z"
  },
  "audit_events": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "actor_type": "system",
      "action": "created",
      "previous_value": null,
      "new_value": {
        "status": "pending"
      },
      "occurred_at": "2026-08-11T10:30:00Z"
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

### 9. Update Visit Request Status
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

### 10. Download Attachment
Download a specific attachment file (admin only).

**Endpoint:** `GET /admin/requests/:id/attachments/:type`

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `id` (string): UUID of the visit request
- `type` (string): Attachment type (`surat_kunjungan` or `surat_tugas`)

**Response:** File (PDF)

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

**Allowed Methods:** `GET`, `POST`, `PATCH`, `OPTIONS`

**Allowed Headers:** `Origin`, `Content-Type`, `Authorization`

---

## Rate Limiting

Public endpoints with rate limiting:
- `GET /public/requests/:token` - 10 requests per second
- `GET /public/requests/:token/qr` - 10 requests per second

Rate limit exceeded responses: `429 Too Many Requests`

---

## Date and Time Format

- **Date:** `YYYY-MM-DD` (ISO 8601)
- **Time:** `HH:MM` or `HH:MM:SS` (24-hour format)
- **DateTime:** ISO 8601 with timezone (e.g., `2026-08-11T10:30:00Z`)
- **Timezone:** Asia/Makassar (UTC+8)
