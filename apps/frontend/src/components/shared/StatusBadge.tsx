import { statusColors } from '@constants/status';
import type { Status } from '@app-types/status';

export { type Status } from '@app-types/status';


export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`font-label-md inline-flex rounded-full px-3 py-1 text-label-md font-bold ${statusColors[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
