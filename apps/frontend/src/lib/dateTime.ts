import { DateTime } from 'luxon';

export const WITA_ZONE = 'Asia/Makassar';

const fromEpoch = (value: number) => DateTime.fromMillis(value, { zone: WITA_ZONE, locale: 'id' });

export function formatDate(value: number, format = 'dd-MM-yyyy'): string {
  const dt = fromEpoch(value);
  return dt.isValid ? dt.toFormat(format) : String(value);
}

export function formatLongDate(value: number): string {
  return formatDate(value, 'EEEE, dd MMMM yyyy');
}

export function formatDateTime(value: number): string {
  const dt = fromEpoch(value);
  return dt.isValid ? dt.toFormat('dd-MM-yyyy HH:mm') : String(value);
}

export function formatTime(value: number): string {
  const dt = fromEpoch(value);
  return dt.isValid ? dt.toFormat('HH:mm') : String(value);
}

export function todayISO(): string {
  return DateTime.now().setZone(WITA_ZONE).toISODate() ?? '';
}

export function todayEpoch(): number {
  return DateTime.now().setZone(WITA_ZONE).startOf('day').toMillis();
}

export function isFutureDate(value: string): boolean {
  const dt = DateTime.fromISO(value, { zone: WITA_ZONE, locale: 'id' });
  return dt.isValid && dt.startOf('day') > DateTime.now().setZone(WITA_ZONE).startOf('day');
}

export function dateInputToEpoch(value: string): number {
  const dt = DateTime.fromISO(value, { zone: WITA_ZONE }).startOf('day');
  return dt.isValid ? dt.toMillis() : NaN;
}

export function timeInputToEpoch(value: string): number {
  const dt = DateTime.fromObject(
    {
      year: 1970,
      month: 1,
      day: 1,
      hour: Number(value.slice(0, 2)),
      minute: Number(value.slice(3, 5)),
    },
    { zone: WITA_ZONE },
  );
  return dt.isValid ? dt.toMillis() : NaN;
}
