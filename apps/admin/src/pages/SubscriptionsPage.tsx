import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Calendar, UserCheck } from 'lucide-react';

export default function SubscriptionsPage() {
  const qc = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [form, setForm] = useState<any>({ name: '', city: 'Bangalore', vehicleType: 'AUTO', billingCycle: 'WEEKLY', basePrice: '', peakHoursDiscount: '0.10', offPeakDiscount: '0.20', peakHoursStart: '06:00', peakHoursEnd: '10:00' });
  const [scheduleForm, setScheduleForm] = useState({ newPrice: '', effectiveFrom: '' });
  const [overrideForm, setOverrideForm] = useState({ driverId: '', customPrice: '', reason: '', validUntil: '' });

  const { data: plans = [] } = useQuery({ queryKey: ['plans'], queryFn: () => api.get('/admin/subscriptions/plans').then(r => r.data.data) });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/subscriptions/plans', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plans'] }); setShowCreate(false); toast.success('Plan created'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.patch(`/admin/subscriptions/plans/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plans'] }); toast.success('Plan updated'); },
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.post(`/admin/subscriptions/plans/${id}/schedule`, data),
    onSuccess: () => { setShowSchedule(false); toast.success('Price change scheduled'); },
  });

  const overrideMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/subscriptions/override', data),
    onSuccess: () => { setShowOverride(false); toast.success('Override applied'); },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
          <Plus size={16} /> New Plan
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {plans.map((plan: any) => (
          <div key={plan.id} className={`bg-white rounded-xl border p-5 cursor-pointer transition-shadow hover:shadow-md ${selectedPlan?.id === plan.id ? 'ring-2 ring-brand-500' : ''}`} onClick={() => setSelectedPlan(plan)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500">{plan.city} · {plan.vehicleType || 'All'}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${plan.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹{plan.basePrice}<span className="text-sm font-normal text-gray-500">/{plan.billingCycle === 'WEEKLY' ? 'week' : 'month'}</span></p>
            <div className="mt-3 text-xs text-gray-500">
              <span>Peak: {(Number(plan.peakHoursDiscount) * 100).toFixed(0)}% off</span>
              <span className="mx-2">·</span>
              <span>Off-peak: {(Number(plan.offPeakDiscount) * 100).toFixed(0)}% off</span>
            </div>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit: {selectedPlan.name}</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {['basePrice', 'peakHoursDiscount', 'offPeakDiscount'].map((field) => (
              <div key={field}>
                <label className="block text-xs text-gray-500 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                <input
                  type="number" defaultValue={selectedPlan[field]}
                  id={`edit-${field}`}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const updates: any = {};
                ['basePrice', 'peakHoursDiscount', 'offPeakDiscount'].forEach(f => {
                  const el = document.getElementById(`edit-${f}`) as HTMLInputElement;
                  if (el) updates[f] = el.value;
                });
                updateMutation.mutate({ id: selectedPlan.id, data: updates });
              }}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
            >
              Save Changes
            </button>
            <button onClick={() => setShowSchedule(true)} className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              <Calendar size={14} /> Schedule Price Change
            </button>
            <button onClick={() => setShowOverride(true)} className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              <UserCheck size={14} /> Driver Override
            </button>
            <button
              onClick={() => updateMutation.mutate({ id: selectedPlan.id, data: { isActive: !selectedPlan.isActive } })}
              className="ml-auto border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              {selectedPlan.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px]">
            <h2 className="text-lg font-semibold mb-4">Create Plan</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {Object.entries(form).map(([k, v]) => (
                <div key={k}>
                  <label className="block text-xs text-gray-500 mb-1 capitalize">{k.replace(/([A-Z])/g, ' $1')}</label>
                  {['vehicleType', 'billingCycle', 'city'].includes(k) ? (
                    <select value={v as string} onChange={e => setForm({ ...form, [k]: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                      {k === 'vehicleType' && ['AUTO', 'CAB', 'EV_CAB', 'BIKE'].map(o => <option key={o}>{o}</option>)}
                      {k === 'billingCycle' && ['WEEKLY', 'MONTHLY'].map(o => <option key={o}>{o}</option>)}
                      {k === 'city' && ['Bangalore', 'Mumbai', 'Delhi'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input value={v as string} onChange={e => setForm({ ...form, [k]: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => createMutation.mutate(form)} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Create</button>
              <button onClick={() => setShowCreate(false)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showSchedule && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">Schedule Price Change</h2>
            <div className="space-y-3 mb-4">
              <input type="number" placeholder="New price (₹)" value={scheduleForm.newPrice} onChange={e => setScheduleForm({...scheduleForm, newPrice: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
              <input type="datetime-local" value={scheduleForm.effectiveFrom} onChange={e => setScheduleForm({...scheduleForm, effectiveFrom: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => scheduleMutation.mutate({ id: selectedPlan.id, data: scheduleForm })} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Schedule</button>
              <button onClick={() => setShowSchedule(false)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showOverride && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">Driver Price Override</h2>
            <div className="space-y-3 mb-4">
              <input placeholder="Driver ID" value={overrideForm.driverId} onChange={e => setOverrideForm({...overrideForm, driverId: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
              <input type="number" placeholder="Custom price (₹)" value={overrideForm.customPrice} onChange={e => setOverrideForm({...overrideForm, customPrice: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
              <input placeholder="Reason" value={overrideForm.reason} onChange={e => setOverrideForm({...overrideForm, reason: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
              <input type="date" value={overrideForm.validUntil} onChange={e => setOverrideForm({...overrideForm, validUntil: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => overrideMutation.mutate({ ...overrideForm, planId: selectedPlan.id })} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Apply</button>
              <button onClick={() => setShowOverride(false)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
