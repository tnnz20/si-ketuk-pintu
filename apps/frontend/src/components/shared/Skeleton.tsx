export default function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`block animate-pulse rounded bg-surface-container-high ${className}`} />;
}
