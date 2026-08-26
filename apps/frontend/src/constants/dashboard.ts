import { DateTime } from 'luxon';

import { WITA_ZONE } from '@lib/dateTime';

export const INDO_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const INDO_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const INDO_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const now = DateTime.now().setZone(WITA_ZONE);
export const DEFAULT_YEAR = now.year;
export const DEFAULT_MONTH = now.month - 1; // 0-indexed
export const YEAR_RANGE = Array.from({ length: 4 }, (_, i) => DEFAULT_YEAR - 3 + i);
