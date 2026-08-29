'use client';

import { useMemo } from 'react';

export type SalesPoint = {
  month: string;
  revenue: number;
  payouts: number;
};

export function SellerEarningsDashboard({ sales = [
  { month: 'Jan', revenue: 5000000, payouts: 4200000 },
  { month: 'Feb', revenue: 7200000, payouts: 6100000 },
  { month: 'Mar', revenue: 9000000, payouts: 7600000 },
  { month: 'Apr', revenue: 10400000, payouts: 8900000 },
] as SalesPoint[] }) {
  const totalRevenue = useMemo(() => sales.reduce((sum, entry) => sum + entry.revenue, 0), [sales]);
  const totalPayouts = useMemo(() => sales.reduce((sum, entry) => sum + entry.payouts, 0), [sales]);

  return (
    <section style={{ display: 'grid', gap: 20, padding: 24, background: '#0f172a', color: 'white', borderRadius: 20, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: '#93c5fd', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 12 }}>Seller dashboard</div>
          <h2 style={{ margin: '8px 0', fontSize: 30 }}>Earnings overview</h2>
        </div>
        <button style={{ border: 'none', background: '#22c55e', color: '#052e16', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontWeight: 700 }}>
          Payouts ready
        </button>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard label="Gross sales" value={`${totalRevenue.toLocaleString('vi-VN')} VND`} />
        <StatCard label="Net payouts" value={`${totalPayouts.toLocaleString('vi-VN')} VND`} />
        <StatCard label="Success rate" value="97.4%" />
        <StatCard label="Average rating" value="4.9/5" />
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {sales.map((entry) => (
          <div key={entry.month} style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 12, padding: 16, border: '1px solid rgba(148,163,184,0.25)' }}>
            <div style={{ color: '#cbd5e1', fontSize: 12 }}>{entry.month}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{entry.revenue.toLocaleString('vi-VN')} VND</div>
            <div style={{ color: '#86efac', marginTop: 8 }}>Payout: {entry.payouts.toLocaleString('vi-VN')} VND</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 12, padding: 18, border: '1px solid rgba(148,163,184,0.25)' }}>
      <div style={{ color: '#cbd5e1', fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>{value}</div>
    </div>
  );
}

export default SellerEarningsDashboard;
