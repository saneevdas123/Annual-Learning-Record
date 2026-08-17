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

const PALETTE = ['#FF4B3E', '#F9CA24', '#58C6B1', '#141414', '#FFD7BA', '#F8A5C2'];

export function CategoryBarChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-ink/45">No data yet.</div>;
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e2d6" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#141414' }}
            tickLine={false}
            axisLine={{ stroke: '#d6d0c4' }}
            interval={0}
            angle={-12}
            textAnchor="end"
            height={48}
          />
          <YAxis tick={{ fontSize: 11, fill: '#141414' }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'rgba(20,20,20,0.04)' }}
            contentStyle={{
              borderRadius: 12,
              border: '2px solid #141414',
              fontSize: 12,
              background: '#FDF8F0',
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
