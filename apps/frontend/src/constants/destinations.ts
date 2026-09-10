import type { TujuanInstansi } from '@app-types/destinations';

export const TUJUAN_INSTANSI_OPTIONS = ['Sekretariat DPRD', 'DPRD Kab. Tapin'] as const;

export const TUJUAN_BAGIAN_OPTIONS: Record<TujuanInstansi, readonly string[]> = {
  'Sekretariat DPRD': [
    'Sekretaris Dewan',
    'Kabag Fasilitasi',
    'Kabag Umum dan Keuangan',
    'Kabag Hukum',
  ],
  'DPRD Kab. Tapin': [
    'Ketua DPRD',
    'Wakil Ketua DPRD I',
    'Wakil Ketua DPRD II',
    'Komisi I',
    'Komisi II',
    'Komisi III',
    'BANGGAR',
    'Bapemperda',
    'BANMUS',
    'Badan Kehormatan',
  ],
};
