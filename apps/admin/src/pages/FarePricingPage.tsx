import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Zap } from 'lucide-react';

const inputCls = 'w-full bg-[#F5F6F8] border-0 rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-amber';

export default function FarePricingPage() {
  const qc = useQueryClient();
  const [surgeModal, setSurgeModal] = useState<any>(null);
  const [surgeValue, setSurgeValue] = useState(1.0);
  const [revertHours, setRevertHours] = useState('');
  const [editing, setEditing] = useState<Record<string, any>>({});

  const { data: rules = [] } = useQuery({ queryKey: ['fare-rules'], queryFn: () => api.get('/admin/fare-rules').then(r => r.data.data) });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.patch(`/admin/fare-rules/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fare-rules'] }); toast.success('Rule updated'); },
  });

  const surgeMutation = useMutation({
    mutationFn: ({ id, surgeMultiplier, revertAfterHours }: any) =>
      api.patch(`/admin/fare-rules/${id}/surge`, { surgeMultiplier, revertAfterHours: revertAfterHours ? Number(revertAfterHours) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fare-rules'] }); setSurgeModal(null); toast.success('Surge updated'); },
  });

  const surgeMultiplier = Number(surgeModal?.surgeMultiplier || 1);
  const surgeColor = surgeValue >= 2 ? 'text-[#DC4E37]' : surgeValue > 1 ? 'text-[#E8941A]' : 'text-[#1E9E6A]';

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy font-display">Fare Pricing</h1>
        <p className="text-muted text-sm mt-1">Base fares, per-km rates, and surge control</p>
      </div>

      <div className="bg-white rounded-2xl shadow-t1 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#E7E9EE]">
            <tr>
              {['City', 'Vehicle', 'Base Fare', 'Per KM', 'Per Min', 'Min Fare', 'Surge', 'Revert At'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E9EE]">
            {rules.map((rule: any) => {
              const ed = editing[rule.id] || {};
              const val = (f: string) => ed[f] !== undefined ? ed[f] : rule[f];
              const setVal = (f: string, v: string) => setEditing({ ...editing, [rule.id]: { ...(editing[rule.id] || {}), [f]: v } });
              const surge = Number(rule.surgeMultiplier);
              return (
                <tr key={rule.id} className="hover:bg-paper/60 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-navy">{rule.city}</td>
                  <td className="px-4 py-3.5 text-muted">{rule.vehicleType}</td>
                  {['baseFare', 'perKmRate', 'perMinRate', 'minimumFare'].map(f => (
                    <td key={f} className="px-4 py-3.5">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-xs">₹</span>
                        <input
                          type="number" value={val(f)} onChange={e => setVal(f, e.target.value)}
                          className="w-24 bg-[#F5F6F8] border-0 rounded-lg pl-6 pr-2 py-1.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-amber"
                          onBlur={() => {
                            if (editing[rule.id]) updateMutation.mutate({ id: rule.id, data: editing[rule.id] });
                          }}
                        />
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => { setSurgeModal(rule); setSurgeValue(surge); setRevertHours(''); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        surge > 1 ? 'bg-[#FFF8E5] text-[#E8941A]' : 'bg-[#F5F6F8] text-muted hover:bg-[#FFF8E5] hover:text-[#E8941A]'
                      }`}
                    >
                      <Zap size={12} fill={surge > 1 ? '#E8941A' : 'none'} />
                      {rule.surgeMultiplier}×
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted">
                    {rule.surgeRevertAt ? new Date(rule.surgeRevertAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {surgeModal && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-t2">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={18} className="text-amber-deep" />
              <h2 className="text-lg font-bold text-navy font-display">Surge Control</h2>
            </div>
            <p className="text-sm text-muted mb-6">{surgeModal.city} · {surgeModal.vehicleType}</p>

            <div className="bg-[#F5F6F8] rounded-2xl p-5 mb-4">
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-xs font-semibold text-muted uppercase tracking-wide">Multiplier</span>
                <span className={`text-4xl font-bold font-display ${surgeColor}`}>{surgeValue.toFixed(1)}×</span>
              </div>
              <input
                type="range" min="1.0" max="3.0" step="0.1" value={surgeValue}
                onChange={e => setSurgeValue(Number(e.target.value))}
                className="w-full accent-[#F7B32B]"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>1.0× Normal</span>
                <span>3.0× Peak</span>
              </div>
            </div>

            <input
              type="number"
              placeholder="Auto-revert after X hours (optional)"
              value={revertHours}
              onChange={e => setRevertHours(e.target.value)}
              className={`${inputCls} mb-5`}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (surgeValue > 1.5 && !window.confirm(`Apply ${surgeValue}× surge to ${surgeModal.city} ${surgeModal.vehicleType}?`)) return;
                  surgeMutation.mutate({ id: surgeModal.id, surgeMultiplier: surgeValue, revertAfterHours: revertHours });
                }}
                className="flex-1 bg-amber text-navy-900 px-4 py-3 rounded-xl text-sm font-bold hover:bg-amber-deep transition-colors"
              >
                Apply {surgeValue.toFixed(1)}× Surge
              </button>
              <button onClick={() => setSurgeModal(null)} className="border rounded-xl px-4 py-3 text-sm text-muted hover:bg-paper transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
