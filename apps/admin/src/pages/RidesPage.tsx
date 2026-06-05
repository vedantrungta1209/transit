import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

const statusColors: Record<string, string> = {
  COMPLETED:       'bg-[#E4F3EC] text-[#1E9E6A]',
  CANCELLED:       'bg-[#FBE9E5] text-[#DC4E37]',
  IN_PROGRESS:     'bg-[#EEF4FF] text-navy-500',
  SEARCHING:       'bg-[#FFF8E5] text-[#E8941A]',
  DRIVER_ASSIGNED: 'bg-[#F0EEFF] text-[#7C5CBF]',
  DRIVER_ARRIVING: 'bg-[#E8F4FF] text-[#3E86F5]',
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
        <div>
          <h1 className="text-2xl font-bold text-navy font-display">Rides</h1>
          <p className="text-muted text-sm mt-1">Live and historical ride log</p>
        </div>
        <select
          value={status} onChange={e => setStatus(e.target.value)}
          className="bg-white border rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-amber shadow-t1"
        >
          <option value="">All Status</option>
          {['SEARCHING','DRIVER_ASSIGNED','DRIVER_ARRIVING','IN_PROGRESS','COMPLETED','CANCELLED'].map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-t1 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#E7E9EE]">
            <tr>
              {['ID', 'User', 'Driver', 'Vehicle', 'Status', 'Fare', 'Date'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E9EE]">
            {data?.data?.map((ride: any) => (
              <tr key={ride.id} className="hover:bg-paper/60 transition-colors">
                <td className="px-4 py-3.5 font-mono text-xs text-muted">{ride.id.slice(0, 8)}</td>
                <td className="px-4 py-3.5 font-medium text-navy">{ride.user?.name || ride.user?.phone || '—'}</td>
                <td className="px-4 py-3.5 text-muted">{ride.driver?.name || '—'}</td>
                <td className="px-4 py-3.5 text-muted">{ride.vehicleType}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[ride.status] || 'bg-[#F5F6F8] text-muted'}`}>
                    {ride.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-semibold text-navy">
                  {ride.actualFare ? `₹${ride.actualFare}` : `~₹${ride.estimatedFare}`}
                </td>
                <td className="px-4 py-3.5 text-muted text-xs">{new Date(ride.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3.5 border-t border-[#E7E9EE]">
          <span className="text-sm text-muted">{data?.meta?.total ?? 0} rides</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-paper transition-colors">Prev</button>
            <button disabled={page >= (data?.meta?.totalPages || 1)} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-paper transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
