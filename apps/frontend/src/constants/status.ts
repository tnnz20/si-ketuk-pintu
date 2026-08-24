import type { Status } from '@app-types/status';

export const statusColors: Record<Status, string> = {
  pending: 'bg-civic-pendingBg text-civic-pendingText border border-civic-border/70',
  approved: 'bg-civic-approvedBg text-civic-approvedText border border-emerald-200/80',
  rejected: 'bg-civic-rejectedBg text-civic-rejectedText border border-rose-200/80',
};

export const statusDetailColors: Record<Status, string> = {
  pending: 'bg-civic-pendingBg text-civic-pendingText border border-civic-border/70',
  approved: 'bg-civic-approvedBg text-civic-approvedText border border-emerald-200/80',
  rejected: 'bg-civic-rejectedBg text-civic-rejectedText border border-rose-200/80',
};

export const statusLabels: Record<Status, string> = {
  pending: 'Pending',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

export const statusDotColors: Record<Status, string> = {
  pending: 'bg-amber-600 animate-pulse',
  approved: 'bg-emerald-600',
  rejected: 'bg-rose-600',
};
