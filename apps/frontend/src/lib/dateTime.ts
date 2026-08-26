import { DateTime } from 'luxon';

export const WITA_ZONE = 'Asia/Makassar';

const fromDate = (value: string) => DateTime.fromISO(value, { zone: WITA_ZONE, locale: 'id' });
const fromTimestamp = (value: string) =>
  DateTime.fromISO(value, { locale: 'id' }).setZone(WITA_ZONE);

export function formatDate(value: string, format = 'dd-MM-yyyy'): string {
  const dt = fromDate(value);
  return dt.isValid ? dt.toFormat(format) : value;
}

export function formatLongDate(value: string): string {
  return formatDate(value, 'EEEE, dd MMMM yyyy');
}

export function formatDateTime(value: string): string {
  const dt = fromTimestamp(value);
  return dt.isValid ? dt.toFormat('dd-MM-yyyy HH:mm') : value;
}

export function todayISO(): string {
  return DateTime.now().setZone(WITA_ZONE).toISODate() ?? '';
}

export function isFutureDate(value: string): boolean {
  const dt = fromDate(value);
  return dt.isValid && dt.startOf('day') > DateTime.now().setZone(WITA_ZONE).startOf('day');
}

export function formatTime(value: string): string {
  const dt = DateTime.fromFormat(value, 'HH:mm');
  return dt.isValid ? dt.toFormat('HH:mm') : value;
}
