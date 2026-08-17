'use client';

import { useEffect, useState, type ReactNode } from 'react';

export type AppTabItem = {
  key: string;
  label: string;
  href: string;
  count?: number;
};

export function AppTabs({
  tabs,
  active: initial,
  panels,
}: {
  tabs: AppTabItem[];
  active: string;
  panels?: Record<string, ReactNode>;
}) {
  const [active, setActive] = useState(initial);
  const [seen, setSeen] = useState(() => new Set([initial]));

  useEffect(() => {
    setActive(initial);
    setSeen((s) => new Set(s).add(initial));
  }, [initial]);

  function select(t: AppTabItem) {
    setActive(t.key);
    setSeen((s) => new Set(s).add(t.key));
    if (t.href) window.history.replaceState(null, '', t.href);
    document.querySelectorAll('input[type="hidden"][name="tab"]').forEach((el) => {
      if (el instanceof HTMLInputElement) el.value = t.key;
    });
  }

  return (
    <div className={panels ? 'space-y-4' : undefined}>
      <nav className="shell-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            className={`ui-tab${active === t.key ? ' is-active' : ''}`}
            onClick={() => select(t)}
          >
            {t.label}
            {t.count != null ? <span className="ui-tab-count">{t.count}</span> : null}
          </button>
        ))}
      </nav>
      {panels
        ? tabs.map((t) =>
            seen.has(t.key) ? (
              <div key={t.key} hidden={active !== t.key} role="tabpanel">
                {panels[t.key]}
              </div>
            ) : null
          )
        : null}
    </div>
  );
}
