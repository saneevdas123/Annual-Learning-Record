'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markAllNotificationsRead, markNotificationRead } from '@/app/(app)/notifications/actions';
import { fmtDate } from '@/lib/utils';

export type Notice = {
  id: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  createdAt: Date | string;
};

export function NotificationBell({ items }: { items: Notice[] }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [, start] = useTransition();
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function openNotice(n: Notice) {
    start(async () => {
      const fd = new FormData();
      fd.set('id', n.id);
      await markNotificationRead(fd);
      setOpen(false);
      if (n.link) router.push(n.link);
    });
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        className="shell-icon-btn relative"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 9a6 6 0 1 1 12 0c0 7 2 8 2 8H4s2-1 2-8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white border border-ink">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="shell-bell-panel" role="menu">
          <div className="flex items-center justify-between px-3 py-2 border-b border-ink/10">
            <p className="text-sm font-bold text-ink">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                className="text-xs font-semibold text-brand"
                onClick={() => start(() => markAllNotificationsRead())}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ink/45">Nothing yet.</p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id} className={`border-t border-ink/8 ${n.read ? '' : 'bg-accent-yellow/40'}`}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-ink/[0.03]"
                    onClick={() => openNotice(n)}
                  >
                    <p className="text-sm font-semibold text-ink">{n.title}</p>
                    {n.message ? <p className="mt-0.5 text-xs text-ink/55 leading-snug">{n.message}</p> : null}
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-ink/40">
                      {fmtDate(n.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
