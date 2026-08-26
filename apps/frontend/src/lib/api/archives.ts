import { api } from './client';
import type { Attachment, PaginatedRequestsResponse, RequestDetailResponse } from '@app-types/api';

export function getArchives(
  page = 1,
  pageSize = 20,
  filters?: { search?: string; date?: string },
): Promise<PaginatedRequestsResponse> {
  const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() });
  if (filters?.search) params.append('search', filters.search);
  if (filters?.date) params.append('date', filters.date);
  return api(`/admin/archives?${params}`);
}

export function getArchiveById(id: string): Promise<RequestDetailResponse> {
  return api(`/admin/requests/${id}`);
}

export async function uploadDocumentationImages(
  id: string,
  files: File[],
): Promise<{ attachments: Attachment[] }> {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  return api(`/admin/archives/${id}/documentations`, { method: 'POST', body: form });
}

export function deleteDocumentationImage(
  id: string,
  attachmentId: number,
): Promise<{ message: string }> {
  return api(`/admin/archives/${id}/documentations/${attachmentId}`, { method: 'DELETE' });
}

export function uploadDaftarAbsen(id: string, file: File): Promise<{ attachment: Attachment }> {
  const form = new FormData();
  form.append('file', file);
  return api(`/admin/archives/${id}/daftar-absen`, { method: 'POST', body: form });
}

export function deleteDaftarAbsen(id: string): Promise<{ message: string }> {
  return api(`/admin/archives/${id}/daftar-absen`, { method: 'DELETE' });
}

export function downloadArchiveAttachment(
  id: string,
  type: 'images' | 'daftar_absen',
  attachmentId: number,
): Promise<Blob> {
  return api(`/admin/archives/${id}/attachments/${type}/${attachmentId}`);
}
