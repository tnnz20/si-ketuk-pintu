import type { Status } from '@app-types/status';

export const statusColors: Record<Status, string> = {
  pending: 'bg-surface-container text-primary',
  approved: 'bg-secondary-container text-on-secondary-container',
  rejected: 'bg-error-container text-on-error-container',
};

export const statusDetailColors: Record<Status, string> = {
  pending: 'bg-surface-dim text-on-surface border border-outline-variant',
  approved: 'bg-secondary-container text-on-secondary-container',
  rejected: 'bg-error-container text-on-error-container',
};
