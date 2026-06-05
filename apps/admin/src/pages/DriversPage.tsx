import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Search, CheckCircle, XCircle, Ban } from 'lucide-react';

const kycBadge = (s: string) => ({
  VERIFIED: 'bg-[#E4F3EC] text-[#1E9E6A]',
  PENDING:  'bg-[#FFF8E5] text-[#E8941A]',
  REJECTED: 'bg-[#FBE9E5] text-[#DC4E37]',
}[s] || 'bg-[#F5F6F8] text-muted');

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
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy font-display">Drivers</h1>
          <p className="text-muted text-sm mt-1">KYC approvals and driver management</p>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/60" strokeWidth={1.8} />
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name or phone…"
              className="w-full bg-white border rounded-xl pl-9 pr-4 py-2.5 text-sm text-navy placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-amber shadow-t1"
            />
          </div>
          <select
            value={kycFilter} onChange={e => setKycFilter(e.target.value)}
            className="bg-white border rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-amber shadow-t1"
          >
            <option value="">All KYC</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow-t1 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[#E7E9EE]">
              <tr>
                {['Name', 'Phone', 'City', 'Vehicle', 'KYC', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E9EE]">
              {data?.data?.map((d: any) => (
                <tr key={d.id} className="hover:bg-paper/60 cursor-pointer transition-colors" onClick={() => setSelected(d)}>
                  <td className="px-4 py-3.5 font-semibold text-navy">{d.name}</td>
                  <td className="px-4 py-3.5 text-muted font-mono text-xs">{d.phone}</td>
                  <td className="px-4 py-3.5 text-muted">{d.city}</td>
                  <td className="px-4 py-3.5 text-navy">{d.vehicleType}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${kycBadge(d.kycStatus)}`}>{d.kycStatus}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${d.isOnline ? 'bg-[#E4F3EC] text-[#1E9E6A]' : 'bg-[#F5F6F8] text-muted'}`}>
                      {d.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-amber-deep text-xs font-semibold">View →</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3.5 border-t border-[#E7E9EE]">
            <span className="text-sm text-muted">{data?.meta?.total ?? 0} drivers</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-paper transition-colors">Prev</button>
              <button disabled={page >= (data?.meta?.totalPages || 1)} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-paper transition-colors">Next</button>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <div className="w-80 bg-white rounded-2xl shadow-t2 p-5 self-start sticky top-8 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-navy font-display">{driverDetail?.name || selected.name}</h2>
              <p className="text-sm text-muted font-mono">{driverDetail?.phone || selected.phone}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-muted hover:text-navy text-lg leading-none">×</button>
          </div>

          <div className="space-y-3 text-sm mb-5 border border-[#E7E9EE] rounded-xl p-3">
            <div className="flex justify-between items-center">
              <span className="text-muted">KYC Status</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${kycBadge(driverDetail?.kycStatus || selected.kycStatus)}`}>
                {driverDetail?.kycStatus || selected.kycStatus}
              </span>
            </div>
            <div className="flex justify-between"><span className="text-muted">Vehicle</span><span className="font-medium text-navy">{driverDetail?.vehicleType}</span></div>
            <div className="flex justify-between"><span className="text-muted">Total Earnings</span><span className="font-bold text-navy">₹{Number(driverDetail?.totalEarnings || 0).toLocaleString('en-IN')}</span></div>
          </div>

          {(driverDetail?.kycStatus || selected.kycStatus) === 'PENDING' && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => kycMutation.mutate({ id: selected.id, status: 'VERIFIED' })}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#1E9E6A] text-white px-3 py-2.5 rounded-xl text-xs font-bold"
              >
                <CheckCircle size={13} /> Approve
              </button>
              <button
                onClick={() => kycMutation.mutate({ id: selected.id, status: 'REJECTED' })}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#DC4E37] text-white px-3 py-2.5 rounded-xl text-xs font-bold"
              >
                <XCircle size={13} /> Reject
              </button>
            </div>
          )}
          <button
            onClick={() => suspendMutation.mutate(selected.id)}
            className="w-full flex items-center justify-center gap-1.5 border border-[#DC4E37]/30 text-[#DC4E37] px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-[#FBE9E5] transition-colors"
          >
            <Ban size={13} /> Suspend Driver
          </button>
        </div>
      )}
    </div>
  );
}
