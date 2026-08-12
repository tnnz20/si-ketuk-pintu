export interface Guest {
  guest_order: number;
  nama: string;
  jabatan: string;
}

export interface Attachment {
  attachment_type: 'surat_kunjungan' | 'surat_tugas';
  original_name: string;
  content_type: string;
  size_bytes: number;
}

export interface VisitRequest {
  id: string;
  token: string;
  email: string;
  nama_instansi: string;
  alamat_instansi: string;
  tanggal_kunjungan: string;
  jam_kunjungan: string;
  tema_kunjungan: string;
  pimpinan_rombongan: string;
  jumlah_tamu: number;
  kontak_dihubungi: string;
  status: 'pending' | 'approved' | 'rejected';
  guests: Guest[];
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: string;
  actor_type: 'admin' | 'system';
  action: string;
  previous_value: null | { status: string };
  new_value: null | { status: string };
  occurred_at: string;
}

export interface RequestDetailResponse {
  request: VisitRequest;
  audit_events: AuditEvent[];
}

export interface CreateVisitRequestData {
  email: string;
  nama_instansi: string;
  alamat_instansi: string;
  tanggal_kunjungan: string;
  jam_kunjungan: string;
  tema_kunjungan: string;
  pimpinan_rombongan: string;
  jumlah_tamu: number;
  kontak_dihubungi: string;
  guests: { nama: string; jabatan: string }[];
  surat_kunjungan: File;
  surat_tugas: File;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface PaginatedRequestsResponse {
  data: {
    id: string;
    token: string;
    nama_instansi: string;
    pimpinan_rombongan: string;
    tanggal_kunjungan: string;
    jumlah_tamu: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
  }[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ErrorResponse {
  error: string;
}
