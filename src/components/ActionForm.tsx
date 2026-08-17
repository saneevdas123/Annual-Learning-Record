'use client';

import { useActionState, type ReactNode } from 'react';
import { toast } from 'sonner';

type Props = {
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
  success?: string;
};

export function ActionForm({ action, children, className, success = 'Saved.' }: Props) {
  const [, formAction] = useActionState(async (_prev: unknown, formData: FormData) => {
    try {
      await action(formData);
      toast.success(success);
      return { ok: true as const };
    } catch (e) {
      if (e && typeof e === 'object' && 'digest' in e) throw e;
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      toast.error(msg);
      return { error: msg };
    }
  }, undefined);

  return (
    <form action={formAction} className={className}>
      {children}
    </form>
  );
}
