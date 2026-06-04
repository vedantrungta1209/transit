import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-50 text-green-700', CANCELLED: 'bg-red-50 text-red-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700', SEARCHING: 'bg-yellow-50 text-yellow-700',
  DRIVER_ASSIGNED: 'bg-purple-50 text-purple-700', DRIVER_ARRIVING: 'bg-indigo-50 text-indigo-700',
};

export default function RidesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data } = useQuery({
    queryKey: ['rides', page, status],
    queryFn: () => api.get('/admin/rides', { params: { page, limit: 20, status: status || undefined } }).then(r => r.data.data),
    refetchInterval: 15000,
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rides</h1>
        <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Status</option>
          {['SEARCHING','DRIVER_ASSIGNED','DRIVER_ARRIVING','IN_PROGRESS','COMPLETED','CANCELLED'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['ID', 'User', 'Driver', 'Vehicle', 'Status', 'Fare', 'Date'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {data?.data?.map((ride: any) => (
              <tr key={ride.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{ride.id.slice(0, 8)}</td>
                <td className="px-4 py-3">{ride.user?.name || ride.user?.phone || '—'}</td>
                <td className="px-4 py-3">{ride.driver?.name || '—'}</td>
                <td className="px-4 py-3">{ride.vehicleType}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColors[ride.status] || 'bg-gray-100'}`}>{ride.status}</span></td>
                <td className="px-4 py-3">{ride.actualFare ? `₹${ride.actualFare}` : `~₹${ride.estimatedFare}`}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(ride.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
          <span>{data?.meta?.total} rides</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
            <button disabled={page >= (data?.meta?.totalPages || 1)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
