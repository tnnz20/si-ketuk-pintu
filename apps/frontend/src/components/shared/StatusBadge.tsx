import { Badge } from '@/components/ui/badge';
import { statusColors, statusDotColors, statusLabels } from '@/constants/status';
import type { Status } from '@/types/status';

export { type Status } from '@/types/status';

interface StatusBadgeProps {
  status: Status;
  showDot?: boolean;
  className?: string;
}

export default function StatusBadge({ status, showDot = true, className = '' }: StatusBadgeProps) {
  const colorClass = statusColors[status] ?? 'bg-civic-neutralFill text-civic-dark';
  const label = statusLabels[status] ?? status;
  const dotColor = statusDotColors[status] ?? 'bg-civic-dark';

  return (
    <Badge
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-2xs font-extrabold tracking-wide sm:text-xs ${colorClass} ${className}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
      <span>{label}</span>
    </Badge>
  );
}
