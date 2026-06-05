import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('monthly');

  const { data } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => api.get('/admin/analytics', { params: { period } }).then(r => r.data.data),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy font-display">Analytics</h1>
          <p className="text-muted text-sm mt-1">Revenue and ride volume trends</p>
        </div>
        <div className="flex gap-1.5 bg-white border rounded-xl p-1 shadow-t1">
          {['daily', 'weekly', 'monthly'].map(p => (
            <button
              key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                period === p
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-muted hover:text-navy'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-2xl shadow-t1 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">Total Ride Revenue</p>
          <p className="text-3xl font-bold text-navy font-display">₹{Number(data?.totalRevenue || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-t1 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">Subscription Revenue</p>
          <p className="text-3xl font-bold text-navy font-display">₹{Number(data?.subscriptionRevenue || 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-t1 p-6">
        <p className="text-sm font-semibold text-navy font-display mb-5">Ride Volume</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data?.rideData || []} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E9EE" vertical={false} />
            <XAxis dataKey="createdAt" tick={{ fontSize: 11, fill: '#5C6B86', fontFamily: 'Manrope' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#5C6B86', fontFamily: 'Manrope' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,43,91,0.10)', fontFamily: 'Manrope', fontSize: 13 }}
              cursor={{ fill: 'rgba(247,179,43,0.08)' }}
            />
            <Bar dataKey="_count" fill="#F7B32B" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
