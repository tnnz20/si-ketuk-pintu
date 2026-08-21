import { api } from './client';
import type {
  CreateVisitRequestData,
  PaginatedRequestsResponse,
  RequestDetailResponse,
  StatsResponse,
  VisitRequest,
} from '@app-types/api';

export async function createVisitRequest(
  request: CreateVisitRequestData,
): Promise<{ token: string; message: string }> {
  const form = new FormData();
  const entries: [string, string | Blob][] = [
    ['email', request.email],
    ['nama_instansi', request.nama_instansi],
    ['alamat_instansi', request.alamat_instansi],
    ['tanggal_kunjungan', request.tanggal_kunjungan],
    ['jam_kunjungan', request.jam_kunjungan],
    ['tema_kunjungan', request.tema_kunjungan],
    ['pimpinan_rombongan', request.pimpinan_rombongan],
    ['jumlah_tamu', String(request.jumlah_tamu)],
    ['kontak_dihubungi', request.kontak_dihubungi],
    ['guests', JSON.stringify(request.guests)],
    ['surat_kunjungan', request.surat_kunjungan],
    ['surat_tugas', request.surat_tugas],
  ];
  entries.forEach(([key, value]) => form.append(key, value));
  return api('/public/requests', { method: 'POST', body: form });
}

export async function getRequests(
  page = 1,
  pageSize = 20,
  filters?: { search?: string; status?: string; date?: string },
): Promise<PaginatedRequestsResponse> {
  const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() });
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.date) params.append('date', filters.date);
  return api(`/admin/requests?${params}`);
}

export function getStats(): Promise<StatsResponse> {
  return api('/admin/stats');
}

export function deleteRequest(id: string): Promise<{ message: string }> {
  return api(`/admin/requests/${id}`, { method: 'DELETE' });
}

export function getRequestById(id: string): Promise<RequestDetailResponse> {
  return api(`/admin/requests/${id}`);
}

export function getRequestByToken(token: string): Promise<VisitRequest> {
  return api(`/public/requests/${token}`);
}

export function updateStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected',
): Promise<{ message: string }> {
  return api(`/admin/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export function downloadQR(token: string): Promise<Blob> {
  return api(`/public/requests/${token}/qr`);
}

export function uploadApprovalLetter(id: string, blob: Blob): Promise<unknown> {
  const form = new FormData();
  form.append('file', blob, 'surat_persetujuan.pdf');
  return api(`/admin/requests/${id}/approval-letter`, { method: 'POST', body: form });
}

export function rescheduleRequest(id: string, payload: { tanggal_kunjungan: string; jam_kunjungan: string }): Promise<{ message: string }> {
  return api(`/admin/requests/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export function uploadRescheduleLetter(id: string, blob: Blob): Promise<unknown> {
  const form = new FormData(); form.append('file', blob, 'surat_reschedule.pdf');
  return api(`/admin/requests/${id}/reschedule-letter`, { method: 'POST', body: form });
}

export function deleteRescheduleLetter(id: string): Promise<{ message: string }> {
  return api(`/admin/requests/${id}/reschedule-letter`, { method: 'DELETE' });
}

export function deleteApprovalLetter(id: string): Promise<{ message: string }> {
  return api(`/admin/requests/${id}/approval-letter`, { method: 'DELETE' });
}

export function downloadAttachment(
  id: string,
  type: 'surat_kunjungan' | 'surat_tugas' | 'surat_persetujuan' | 'surat_reschedule',
): Promise<Blob> {
  return api(`/admin/requests/${id}/attachments/${type}`);
}

export function downloadAttachmentByToken(
  token: string,
  type: 'surat_kunjungan' | 'surat_tugas',
): Promise<Blob> {
  return api(`/public/requests/${token}/attachments/${type}`);
}
