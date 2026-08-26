import type { HTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { Children, isValidElement, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type TooltipProps = PropsWithChildren<{ className?: string }>;

const isTooltipContent = (child: ReactNode): boolean =>
  isValidElement(child) && child.type === TooltipContent;

export function Tooltip({ children, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  const blocks = Children.toArray(children);
  const content = blocks.find(isTooltipContent);

  function show() {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r) {
      setRect({ top: r.top, left: r.left + r.width / 2 });
      setOpen(true);
    }
  }

  function hide() {
    setOpen(false);
  }

  return (
    <span
      ref={wrapRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
      className={`relative inline-flex ${className ?? ''}`}
    >
      {blocks.filter((child) => !isTooltipContent(child))}
      {open &&
        content &&
        createPortal(
          <div
            style={{ top: rect.top, left: rect.left }}
            className="pointer-events-none fixed z-50 mb-2 -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95 duration-150"
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  );
}

export function TooltipTrigger({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span {...props} className={`inline-flex ${className ?? ''}`}>
      {children}
    </span>
  );
}

export function TooltipContent({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      role="tooltip"
      data-tooltip-content="true"
      className={`whitespace-nowrap rounded-md bg-primary px-3 py-1.5 text-label-sm text-on-primary shadow-lg ${className ?? ''}`}
    >
      {children}
    </span>
  );
}