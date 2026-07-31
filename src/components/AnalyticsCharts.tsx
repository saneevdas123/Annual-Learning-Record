'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';

const PALETTE = ['#20223f', '#b23a2e', '#a17c3a', '#3b3f6b', '#c98a3a', '#5a5e8c'];

export function CategoryBarChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-ink-muted">
        No data yet.
      </div>
    );
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e3d8" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#6b6f8c' }}
            tickLine={false}
            axisLine={{ stroke: '#d9d6cb' }}
            interval={0}
            angle={-12}
            textAnchor="end"
            height={48}
          />
          <YAxis tick={{ fontSize: 11, fill: '#6b6f8c' }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'rgba(32,34,63,0.05)' }}
            contentStyle={{
              borderRadius: 10,
              border: '1px solid #e0ddd0',
              fontSize: 12,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
