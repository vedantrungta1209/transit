import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Fare Pricing</h1>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['City', 'Vehicle', 'Base Fare', 'Per KM', 'Per Min', 'Min Fare', 'Surge', ''].map(h =>
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
            )}</tr>
          </thead>
          <tbody className="divide-y">
            {rules.map((rule: any) => {
              const ed = editing[rule.id] || {};
              const val = (f: string) => ed[f] !== undefined ? ed[f] : rule[f];
              const setVal = (f: string, v: string) => setEditing({ ...editing, [rule.id]: { ...(editing[rule.id] || {}), [f]: v } });
              return (
                <tr key={rule.id}>
                  <td className="px-4 py-3 font-medium">{rule.city}</td>
                  <td className="px-4 py-3">{rule.vehicleType}</td>
                  {['baseFare', 'perKmRate', 'perMinRate', 'minimumFare'].map(f => (
                    <td key={f} className="px-4 py-3">
                      <input
                        type="number" value={val(f)} onChange={e => setVal(f, e.target.value)}
                        className="w-20 border rounded px-2 py-1 text-sm"
                        onBlur={() => {
                          if (editing[rule.id]) updateMutation.mutate({ id: rule.id, data: editing[rule.id] });
                        }}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSurgeModal(rule); setSurgeValue(Number(rule.surgeMultiplier)); }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${Number(rule.surgeMultiplier) > 1 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}
                    >
                      {rule.surgeMultiplier}x
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{rule.surgeRevertAt ? `Reverts ${new Date(rule.surgeRevertAt).toLocaleTimeString('en-IN')}` : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {surgeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h2 className="text-lg font-semibold mb-1">Surge Control</h2>
            <p className="text-sm text-gray-500 mb-4">{surgeModal.city} · {surgeModal.vehicleType}</p>
            <div className="mb-4">
              <input type="range" min="1.0" max="3.0" step="0.1" value={surgeValue}
                onChange={e => setSurgeValue(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1"><span>1.0x</span><span className="font-bold text-lg text-orange-600">{surgeValue.toFixed(1)}x</span><span>3.0x</span></div>
            </div>
            <input type="number" placeholder="Auto-revert after X hours (optional)" value={revertHours} onChange={e => setRevertHours(e.target.value)} className="w-full border rounded px-3 py-2 text-sm mb-4" />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (surgeValue > 1.5 && !window.confirm(`Apply ${surgeValue}x surge to ${surgeModal.city} ${surgeModal.vehicleType}?`)) return;
                  surgeMutation.mutate({ id: surgeModal.id, surgeMultiplier: surgeValue, revertAfterHours: revertHours });
                }}
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Apply Surge
              </button>
              <button onClick={() => setSurgeModal(null)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
