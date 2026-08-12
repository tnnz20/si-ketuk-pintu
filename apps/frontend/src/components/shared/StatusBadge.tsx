export type Status = 'pending' | 'approved' | 'rejected';

const statusColors = {
  pending: 'bg-surface-container text-primary',
  approved: 'bg-secondary-container text-on-secondary-container',
  rejected: 'bg-error-container text-on-error-container',
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex px-3 py-1 rounded-full font-label-md text-label-md font-bold ${statusColors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
