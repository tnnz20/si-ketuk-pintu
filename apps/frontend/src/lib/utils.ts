import { DateTime } from 'luxon';
import type { NavigateFunction } from 'react-router';

export { cn } from 'cn';

export function renderValue(value: string | null | undefined): string {
  return value ? value : '—';
}

export function formatDateTimeId(isoString: string): string {
  if (!isoString) return '—';
  return DateTime.fromISO(isoString).setLocale('id').toFormat('dd LLL yyyy, HH:mm');
}

export function formatDateId(isoString: string): string {
  if (!isoString) return '—';
  return DateTime.fromISO(isoString).setLocale('id').toFormat('dd LLL yyyy');
}

export function toErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Terjadi kesalahan yang tidak diketahui.';
  }
  return error.message || 'Terjadi kesalahan yang tidak diketahui.';
}

export function navigateBack(navigate: NavigateFunction, fallback: string): void {
  const index = (window.history.state as { idx?: number } | null)?.idx ?? 0;
  if (index > 0) {
    navigate(-1);
    return;
  }
  navigate(fallback);
}
