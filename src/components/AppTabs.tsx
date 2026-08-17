import Link from 'next/link';

export type AppTabItem = {
  key: string;
  label: string;
  href: string;
  count?: number;
};

export function AppTabs({ tabs, active }: { tabs: AppTabItem[]; active: string }) {
  return (
    <nav className="shell-tabs" role="tablist">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          role="tab"
          aria-selected={active === t.key}
          className={`ui-tab${active === t.key ? ' is-active' : ''}`}
        >
          {t.label}
          {t.count != null ? <span className="ui-tab-count">{t.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
