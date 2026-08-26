import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
};

export function Select({ className, wrapperClassName, children, ...props }: SelectProps) {
  return (
    <div className={`relative ${wrapperClassName ?? ''}`}>
      <select {...props} className={`w-full appearance-none pr-10 ${className ?? ''}`}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-on-surface-variant" />
    </div>
  );
}
