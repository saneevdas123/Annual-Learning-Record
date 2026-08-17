import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'sidebar' | 'light' | 'compact' | 'stack';

export function CutmLogo({
  height = 36,
  className = '',
  priority = false,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const width = Math.round(height * 0.65);
  return (
    <Image
      src="/cutm-logo.png"
      alt="Centurion University of Technology and Management"
      width={width}
      height={height}
      className={cn('w-auto object-contain', className)}
      style={{ height }}
      priority={priority}
    />
  );
}

export function CutmMark({
  variant = 'light',
  href = '/',
  title = 'ALR',
  subtitle,
  className = '',
  priority = false,
}: {
  variant?: Variant;
  href?: string | null;
  title?: string;
  subtitle?: string;
  className?: string;
  priority?: boolean;
}) {
  const heights = { sidebar: 40, light: 34, compact: 28, stack: 56 } as const;
  const dark = variant === 'sidebar';

  const inner = (
    <span
      className={cn(
        'inline-flex min-w-0',
        variant === 'stack' ? 'flex-col items-center text-center gap-2' : 'items-center gap-2.5',
        className
      )}
    >
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center overflow-hidden bg-cream',
          variant === 'sidebar' && 'rounded-xl border border-cream/25 p-1',
          variant === 'light' && 'rounded-xl border-2 border-ink p-1 shadow-hard-sm',
          variant === 'compact' && 'rounded-lg border-2 border-ink p-0.5',
          variant === 'stack' && 'rounded-neo border-2 border-ink p-2 shadow-hard-sm'
        )}
      >
        <CutmLogo height={heights[variant]} priority={priority} />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block font-bold tracking-tight leading-none',
            dark ? 'text-cream' : 'text-ink',
            variant === 'compact' ? 'text-sm' : 'text-base'
          )}
        >
          {title}
        </span>
        {subtitle ? (
          <span
            className={cn(
              'mt-1 block text-[10px] font-semibold uppercase tracking-[0.08em]',
              dark ? 'text-cream/55' : 'text-ink/45'
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="inline-flex min-w-0 no-underline">
      {inner}
    </Link>
  );
}
