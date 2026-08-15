export type Status = 'pending' | 'approved' | 'rejected';

const statusColors = {
  pending: 'bg-surface-container text-primary',
  approved: 'bg-secondary-container text-on-secondary-container',
  rejected: 'bg-error-container text-on-error-container',
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`font-label-md inline-flex rounded-full px-3 py-1 text-label-md font-bold ${statusColors[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
