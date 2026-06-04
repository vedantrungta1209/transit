import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Search, CheckCircle, XCircle, Ban } from 'lucide-react';

const kycBadge = (s: string) => ({ VERIFIED: 'bg-green-50 text-green-700', PENDING: 'bg-yellow-50 text-yellow-700', REJECTED: 'bg-red-50 text-red-700' }[s] || 'bg-gray-100 text-gray-600');

export default function DriversPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  const { data } = useQuery({
    queryKey: ['drivers', search, kycFilter, page],
    queryFn: () => api.get('/admin/drivers', { params: { search, kycStatus: kycFilter || undefined, page, limit: 20 } }).then(r => r.data.data),
  });

  const { data: driverDetail } = useQuery({
    queryKey: ['driver', selected?.id],
    queryFn: () => api.get(`/admin/drivers/${selected.id}`).then(r => r.data.data),
    enabled: !!selected?.id,
  });

  const kycMutation = useMutation({
    mutationFn: ({ id, status }: any) => api.patch(`/admin/drivers/${id}/kyc`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drivers'] }); qc.invalidateQueries({ queryKey: ['driver'] }); toast.success('KYC updated'); },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/drivers/${id}/suspend`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drivers'] }); setSelected(null); toast.success('Driver suspended'); },
  });

  return (
    <div className="p-8 flex gap-6">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Drivers</h1>
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or phone..." className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm" />
          </div>
          <select value={kycFilter} onChange={e => setKycFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">All KYC Status</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Name', 'Phone', 'City', 'Vehicle', 'KYC', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {data?.data?.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(d)}>
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-gray-500">{d.phone}</td>
                  <td className="px-4 py-3">{d.city}</td>
                  <td className="px-4 py-3">{d.vehicleType}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${kycBadge(d.kycStatus)}`}>{d.kycStatus}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${d.isOnline ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{d.isOnline ? 'Online' : 'Offline'}</span></td>
                  <td className="px-4 py-3 text-brand-600 text-xs">View →</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>{data?.meta?.total} drivers</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
              <button disabled={page >= (data?.meta?.totalPages || 1)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <div className="w-80 bg-white rounded-xl border p-5 self-start sticky top-8">
          <h2 className="font-semibold text-gray-900 mb-1">{driverDetail?.name || selected.name}</h2>
          <p className="text-sm text-gray-500 mb-4">{driverDetail?.phone || selected.phone}</p>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between"><span className="text-gray-500">KYC</span><span className={`text-xs px-2 py-0.5 rounded-full ${kycBadge(driverDetail?.kycStatus || selected.kycStatus)}`}>{driverDetail?.kycStatus || selected.kycStatus}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Vehicle</span><span>{driverDetail?.vehicleType}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Earnings</span><span>₹{Number(driverDetail?.totalEarnings || 0).toLocaleString('en-IN')}</span></div>
          </div>
          {(driverDetail?.kycStatus || selected.kycStatus) === 'PENDING' && (
            <div className="flex gap-2 mb-3">
              <button onClick={() => kycMutation.mutate({ id: selected.id, status: 'VERIFIED' })} className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium">
                <CheckCircle size={14} /> Approve
              </button>
              <button onClick={() => kycMutation.mutate({ id: selected.id, status: 'REJECTED' })} className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium">
                <XCircle size={14} /> Reject
              </button>
            </div>
          )}
          <button onClick={() => suspendMutation.mutate(selected.id)} className="w-full flex items-center justify-center gap-1 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-50">
            <Ban size={14} /> Suspend Driver
          </button>
        </div>
      )}
    </div>
  );
}
