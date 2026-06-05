import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Calendar, UserCheck } from 'lucide-react';

const inputCls = 'w-full bg-[#F5F6F8] border-0 rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-amber';

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

  const Modal = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-t2">
        <h2 className="text-lg font-bold text-navy font-display mb-5">{title}</h2>
        {children}
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy font-display">Subscription Plans</h1>
          <p className="text-muted text-sm mt-1">Driver subscription tiers and pricing</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-amber text-navy-900 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-deep transition-colors shadow-t1"
        >
          <Plus size={15} /> New Plan
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        {plans.map((plan: any) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan)}
            className={`bg-white rounded-2xl p-5 cursor-pointer transition-all shadow-t1 hover:shadow-t2 ${
              selectedPlan?.id === plan.id ? 'ring-2 ring-amber' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-navy font-display">{plan.name}</h3>
                <p className="text-xs text-muted mt-0.5">{plan.city} · {plan.vehicleType || 'All'}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${plan.isActive ? 'bg-[#E4F3EC] text-[#1E9E6A]' : 'bg-[#F5F6F8] text-muted'}`}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-2xl font-bold text-navy font-display">
              ₹{plan.basePrice}
              <span className="text-sm font-normal text-muted">/{plan.billingCycle === 'WEEKLY' ? 'wk' : 'mo'}</span>
            </p>
            <div className="mt-3 flex gap-3 text-xs text-muted">
              <span className="bg-[#F5F6F8] px-2 py-1 rounded-lg">Peak: {(Number(plan.peakHoursDiscount) * 100).toFixed(0)}% off</span>
              <span className="bg-[#F5F6F8] px-2 py-1 rounded-lg">Off-peak: {(Number(plan.offPeakDiscount) * 100).toFixed(0)}% off</span>
            </div>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="bg-white rounded-2xl shadow-t1 p-6 mb-6">
          <h2 className="text-base font-bold text-navy font-display mb-5">Edit: {selectedPlan.name}</h2>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {['basePrice', 'peakHoursDiscount', 'offPeakDiscount'].map((field) => (
              <div key={field}>
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
                  {field.replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  type="number" defaultValue={selectedPlan[field]} id={`edit-${field}`}
                  className={inputCls}
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
              className="bg-amber text-navy-900 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-deep transition-colors"
            >
              Save Changes
            </button>
            <button onClick={() => setShowSchedule(true)} className="flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-medium text-navy hover:bg-paper transition-colors">
              <Calendar size={14} /> Schedule Price Change
            </button>
            <button onClick={() => setShowOverride(true)} className="flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-medium text-navy hover:bg-paper transition-colors">
              <UserCheck size={14} /> Driver Override
            </button>
            <button
              onClick={() => updateMutation.mutate({ id: selectedPlan.id, data: { isActive: !selectedPlan.isActive } })}
              className="ml-auto border rounded-xl px-4 py-2.5 text-sm text-muted hover:bg-paper transition-colors"
            >
              {selectedPlan.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <Modal title="Create Subscription Plan">
          <div className="grid grid-cols-2 gap-3 mb-5">
            {Object.entries(form).map(([k, v]) => (
              <div key={k}>
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 capitalize">{k.replace(/([A-Z])/g, ' $1')}</label>
                {['vehicleType', 'billingCycle', 'city'].includes(k) ? (
                  <select value={v as string} onChange={e => setForm({ ...form, [k]: e.target.value })} className={inputCls}>
                    {k === 'vehicleType' && ['AUTO', 'CAB', 'EV_CAB', 'BIKE'].map(o => <option key={o}>{o}</option>)}
                    {k === 'billingCycle' && ['WEEKLY', 'MONTHLY'].map(o => <option key={o}>{o}</option>)}
                    {k === 'city' && ['Bangalore', 'Mumbai', 'Delhi'].map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input value={v as string} onChange={e => setForm({ ...form, [k]: e.target.value })} className={inputCls} />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => createMutation.mutate(form)} className="bg-amber text-navy-900 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-deep transition-colors">Create</button>
            <button onClick={() => setShowCreate(false)} className="border rounded-xl px-4 py-2.5 text-sm text-muted hover:bg-paper transition-colors">Cancel</button>
          </div>
        </Modal>
      )}

      {showSchedule && selectedPlan && (
        <Modal title="Schedule Price Change">
          <div className="space-y-3 mb-5">
            <input type="number" placeholder="New price (₹)" value={scheduleForm.newPrice} onChange={e => setScheduleForm({...scheduleForm, newPrice: e.target.value})} className={inputCls} />
            <input type="datetime-local" value={scheduleForm.effectiveFrom} onChange={e => setScheduleForm({...scheduleForm, effectiveFrom: e.target.value})} className={inputCls} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => scheduleMutation.mutate({ id: selectedPlan.id, data: scheduleForm })} className="bg-amber text-navy-900 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-deep transition-colors">Schedule</button>
            <button onClick={() => setShowSchedule(false)} className="border rounded-xl px-4 py-2.5 text-sm text-muted hover:bg-paper transition-colors">Cancel</button>
          </div>
        </Modal>
      )}

      {showOverride && selectedPlan && (
        <Modal title="Driver Price Override">
          <div className="space-y-3 mb-5">
            <input placeholder="Driver ID" value={overrideForm.driverId} onChange={e => setOverrideForm({...overrideForm, driverId: e.target.value})} className={inputCls} />
            <input type="number" placeholder="Custom price (₹)" value={overrideForm.customPrice} onChange={e => setOverrideForm({...overrideForm, customPrice: e.target.value})} className={inputCls} />
            <input placeholder="Reason" value={overrideForm.reason} onChange={e => setOverrideForm({...overrideForm, reason: e.target.value})} className={inputCls} />
            <input type="date" value={overrideForm.validUntil} onChange={e => setOverrideForm({...overrideForm, validUntil: e.target.value})} className={inputCls} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => overrideMutation.mutate({ ...overrideForm, planId: selectedPlan.id })} className="bg-amber text-navy-900 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-deep transition-colors">Apply</button>
            <button onClick={() => setShowOverride(false)} className="border rounded-xl px-4 py-2.5 text-sm text-muted hover:bg-paper transition-colors">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
