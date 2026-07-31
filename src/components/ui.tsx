import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-indigo-50 text-ink-muted border-indigo-200',
  SUBMITTED: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  UNDER_REVIEW: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REVISION: 'bg-brass-50 text-brass-600 border-brass-100',
  REJECTED: 'bg-seal-50 text-seal-600 border-seal-100',
  FLAGGED: 'bg-seal-50 text-seal-700 border-seal-300',
  PENDING: 'bg-indigo-50 text-ink-muted border-indigo-200',
  IN_REVIEW: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  SIGNED_OFF: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EXPORTED: 'bg-brass-50 text-brass-600 border-brass-100',
  SIGNED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RETURNED: 'bg-brass-50 text-brass-600 border-brass-100',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REVISION: 'Needs revision',
  REJECTED: 'Rejected',
  FLAGGED: 'Flagged',
  PENDING: 'Pending',
  IN_REVIEW: 'In review',
  SIGNED_OFF: 'Signed off',
  EXPORTED: 'Exported',
  SIGNED: 'Signed',
  RETURNED: 'Returned',
};

export function SealDisc({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn('seal-disc', STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function Badge({
  children,
  tone = 'indigo',
}: {
  children: React.ReactNode;
  tone?: 'indigo' | 'seal' | 'brass' | 'muted';
}) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    seal: 'bg-seal-50 text-seal-600 border-seal-100',
    brass: 'bg-brass-50 text-brass-600 border-brass-100',
    muted: 'bg-indigo-50 text-ink-muted border-indigo-100',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'light',
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'ink' | 'seal' | 'brass' | 'light';
}) {
  const tones = {
    ink: 'bg-indigo-800 text-white border-transparent',
    seal: 'bg-seal-500 text-white border-transparent',
    brass: 'bg-brass-500 text-white border-transparent',
    light: 'bg-surface text-ink border-indigo-100',
  };
  return (
    <div className={cn('rounded-xl border p-5 shadow-card', tones[tone])}>
      {hint && (
        <p className="font-mono text-[10px] uppercase tracking-wide opacity-70">{hint}</p>
      )}
      <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm opacity-80">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-white/60 px-6 py-14 text-center">
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Progress({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-100">
      <div
        className="h-full rounded-full bg-brass-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-3xl text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
