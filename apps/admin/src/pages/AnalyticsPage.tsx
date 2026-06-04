import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('monthly');

  const { data } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => api.get('/admin/analytics', { params: { period } }).then(r => r.data.data),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${period === p ? 'bg-brand-600 text-white' : 'border text-gray-600 hover:bg-gray-50'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Ride Revenue</p>
          <p className="text-3xl font-bold text-gray-900">₹{Number(data?.totalRevenue || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Subscription Revenue</p>
          <p className="text-3xl font-bold text-gray-900">₹{Number(data?.subscriptionRevenue || 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <p className="text-sm font-medium text-gray-700 mb-4">Ride Volume</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data?.rideData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="createdAt" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="_count" fill="#0284c7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
