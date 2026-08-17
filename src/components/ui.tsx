'use client';

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STAT_ACCENTS: Record<string, string> = {
  brand: 'bg-accent-peach',
  red: 'bg-accent-pink',
  amber: 'bg-accent-yellow',
  green: 'bg-accent-mint',
  gray: 'bg-white',
};

export function PageHead({
  title,
  subtitle,
  eyebrow,
  action,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 sm:mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <p className="text-brand font-semibold italic text-sm mb-1">{eyebrow}</p> : null}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink leading-tight">{title}</h1>
        {subtitle ? <p className="text-ink/55 mt-1.5 text-sm leading-relaxed max-w-2xl">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}

/** @deprecated use PageHead */
export const PageHeader = PageHead;

export function TabBar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`shell-tabs mb-4 ${className}`} role="tablist">
      {children}
    </div>
  );
}

export function Tab({
  active,
  onClick,
  children,
  href,
  count,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  href?: string;
  count?: number;
}) {
  const cls = `ui-tab${active ? ' is-active' : ''}`;
  const body = (
    <>
      {children}
      {count != null ? <span className="ui-tab-count">{count}</span> : null}
    </>
  );
  if (href) {
    return (
      <a href={href} className={cls} role="tab" aria-selected={!!active}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" role="tab" aria-selected={!!active} className={cls} onClick={onClick}>
      {body}
    </button>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = 'brand',
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: 'brand' | 'red' | 'amber' | 'green' | 'gray';
}) {
  return (
    <div className={`card p-3.5 sm:p-5 ${STAT_ACCENTS[tone] || STAT_ACCENTS.brand}`}>
      <div className="text-[10px] sm:text-xs font-bold text-ink/55 uppercase tracking-wide">{label}</div>
      <div className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-ink">{value}</div>
      {sub ? <div className="mt-1 text-xs font-medium text-ink/55">{sub}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'light',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'ink' | 'seal' | 'brass' | 'light';
}) {
  const map = { ink: 'gray', seal: 'red', brass: 'amber', light: 'brand' } as const;
  return <Stat label={label} value={value} sub={hint} tone={map[tone]} />;
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = '',
  accent,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: 'yellow' | 'mint' | 'peach' | 'pink';
}) {
  const accents = {
    yellow: 'bg-accent-yellow',
    mint: 'bg-accent-mint',
    peach: 'bg-accent-peach',
    pink: 'bg-accent-pink',
  };
  return (
    <div className={`card overflow-hidden ${accent ? accents[accent] : 'bg-white'} ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 border-b border-ink/10">
          <div className="min-w-0">
            {title ? <h3 className="font-bold text-ink">{title}</h3> : null}
            {subtitle ? <p className="text-xs text-ink/50 mt-0.5 leading-snug">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2 shrink-0">{actions}</div> : null}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

const FIELD_SELECTOR = [
  'input:not([disabled]):not([type="hidden"]):not([type="submit"]):not([type="button"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
].join(', ');

function modalFields(root: Element | null) {
  return [...(root?.querySelectorAll(FIELD_SELECTOR) || [])] as HTMLElement[];
}

function onModalEnter(e: React.KeyboardEvent) {
  if (e.key !== 'Enter' || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const el = e.target;
  if (!(el instanceof HTMLElement)) return;
  if (el.closest('textarea') || el.tagName === 'TEXTAREA') return;
  if (el.matches('button, [type="submit"], a[href]')) return;
  if (!el.matches('input, select')) return;
  e.preventDefault();
  const root = el.closest('[role="dialog"]');
  const fields = modalFields(root);
  const i = fields.indexOf(el);
  if (i >= 0 && i < fields.length - 1) fields[i + 1].focus();
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide,
  footer,
  nested = false,
  hideClose = false,
  compact = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
  nested?: boolean;
  hideClose?: boolean;
  compact?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descId = useId();
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => {
      const root = panelRef.current;
      if (!root) return;
      if (root.contains(document.activeElement) && document.activeElement !== root) return;
      const body = root.querySelector('.ui-modal-body');
      const firstField = modalFields(body)[0];
      const firstBtn = root.querySelector('.ui-modal-foot button:not([disabled]), .ui-modal-close');
      (firstField || (firstBtn as HTMLElement | null))?.focus?.();
    }, 30);
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current?.();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={`ui-modal-backdrop no-print${nested ? ' ui-modal-backdrop--nested' : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`ui-modal-panel${wide ? ' ui-modal-wide' : ''}${compact ? ' ui-modal-compact' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onModalEnter}
      >
        <div className="ui-modal-head">
          <div className="min-w-0 pr-3">
            <h3 id={titleId} className="font-bold text-ink text-lg leading-tight">
              {title}
            </h3>
            {description ? (
              <p id={descId} className="text-sm text-ink/55 mt-1 leading-snug">
                {description}
              </p>
            ) : null}
          </div>
          {hideClose ? null : (
            <button type="button" onClick={onClose} className="ui-modal-close" aria-label="Close">
              ×
            </button>
          )}
        </div>
        {children != null ? <div className="ui-modal-body">{children}</div> : null}
        {footer ? <div className="ui-modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  error,
  optional,
  htmlFor,
  className = '',
}: {
  label?: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  optional?: boolean;
  htmlFor?: string;
  className?: string;
}) {
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ className?: string; 'aria-invalid'?: boolean }>, {
        className: [(children as ReactElement<{ className?: string }>).props.className, error ? 'input-invalid' : '']
          .filter(Boolean)
          .join(' '),
        'aria-invalid': error ? true : undefined,
      })
    : children;

  return (
    <div className={`ui-field ${error ? 'has-error' : ''} ${className}`}>
      {label ? (
        <label className="label" htmlFor={htmlFor}>
          <span>{label}</span>
          {optional ? <span className="ui-field-optional">optional</span> : null}
        </label>
      ) : null}
      {control}
      {error ? (
        <p className="ui-field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="ui-field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="ui-field-grid">{children}</div>;
}

export function SubmitButton({
  loading,
  children,
  loadingText = 'Saving…',
  className = 'btn-primary hero-cta-shine w-full !py-3',
  type = 'submit',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
}) {
  return (
    <button
      type={type}
      className={`${className} inline-flex items-center justify-center gap-2`}
      disabled={!!loading || !!disabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span className="login-btn-spinner" aria-hidden />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  loadingText = 'Working…',
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  loadingText?: string;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      description={description}
      hideClose
      compact
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <SubmitButton
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            loading={loading}
            loadingText={loadingText}
            onClick={onConfirm}
          >
            {confirmLabel}
          </SubmitButton>
        </>
      }
    />
  );
}

export function Badge({
  children,
  tone = 'gray',
}: {
  children: ReactNode;
  tone?: 'gray' | 'green' | 'red' | 'amber' | 'blue' | 'brand' | 'indigo' | 'seal' | 'brass' | 'muted';
}) {
  const tones: Record<string, string> = {
    gray: 'bg-ink/8 text-ink/70',
    green: 'bg-accent-mint text-ink',
    red: 'bg-accent-pink text-ink',
    amber: 'bg-accent-yellow text-ink',
    blue: 'bg-sky-100 text-ink',
    brand: 'bg-brand-light text-ink',
    indigo: 'bg-sky-100 text-ink',
    seal: 'bg-accent-pink text-ink',
    brass: 'bg-accent-yellow text-ink',
    muted: 'bg-ink/8 text-ink/70',
  };
  return <span className={`badge ${tones[tone] || tones.gray}`}>{children}</span>;
}

const STATUS_TONES: Record<string, 'gray' | 'green' | 'red' | 'amber' | 'blue' | 'brand'> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  UNDER_REVIEW: 'brand',
  APPROVED: 'green',
  REVISION: 'amber',
  REJECTED: 'red',
  FLAGGED: 'red',
  PENDING: 'gray',
  IN_REVIEW: 'blue',
  SIGNED_OFF: 'green',
  EXPORTED: 'amber',
  SIGNED: 'green',
  RETURNED: 'amber',
  OPEN: 'amber',
  UPHELD: 'green',
  DENIED: 'red',
  WITHDRAWN: 'gray',
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
  OPEN: 'Open',
  UPHELD: 'Upheld',
  DENIED: 'Denied',
  WITHDRAWN: 'Withdrawn',
};

export function statusTone(s: string) {
  return STATUS_TONES[s] || 'gray';
}

export function SealDisc({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn(className)}>
      <Badge tone={statusTone(status)}>{STATUS_LABELS[status] ?? status}</Badge>
    </span>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-neo border-2 border-dashed border-ink/20 bg-white px-6 py-14 text-center">
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-accent-yellow text-lg font-bold shadow-hard-sm" aria-hidden>
        ·
      </span>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink/55">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Progress({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

const ERROR_RE =
  /fail|error|invalid|required|already|choose|select|could not|unable|missing|denied|unauthorized|not found|fix the|forbidden/i;

export function useBusy() {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function run<T>(fn: () => Promise<T>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      return await fn();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return [busy, run] as const;
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function requiredFields(spec: Record<string, [unknown, string]>) {
  const errors: Record<string, string> = {};
  for (const [key, [value, message]] of Object.entries(spec)) {
    if (value == null || String(value).trim() === '') errors[key] = message;
  }
  return errors;
}

export function useToast() {
  const show = (m: unknown) => {
    if (m == null || m === '') return;
    const text = String(m);
    if (ERROR_RE.test(text)) toast.error(text);
    else toast.success(text);
  };
  show.success = (m: unknown) => {
    if (m) toast.success(String(m));
  };
  show.error = (m: unknown) => {
    if (m) toast.error(String(m));
  };
  show.info = (m: unknown) => {
    if (m) toast(String(m));
  };
  return { show, node: null };
}
