import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Car, Users, IndianRupee, CreditCard, AlertCircle, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, accent }: { title: string; value: any; icon: any; accent: string }) => (
  <div className="bg-white rounded-2xl p-6 shadow-t1 border-0">
    <div className="flex items-center justify-between mb-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">{title}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon size={18} strokeWidth={1.8} />
      </div>
    </div>
    <p className="text-3xl font-bold text-navy font-display">{value ?? '—'}</p>
  </div>
);

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/admin/dashboard/stats').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const stats = [
    { title: "Today's Rides",        value: data?.todayRides,           icon: Car,          accent: 'bg-[#EEF4FF] text-navy-500' },
    { title: 'Active Drivers',       value: data?.activeDrivers,        icon: Users,        accent: 'bg-[#E4F3EC] text-[#1E9E6A]' },
    { title: 'Revenue Today',        value: data?.revenueToday ? `₹${data.revenueToday.toLocaleString('en-IN')}` : null, icon: IndianRupee, accent: 'bg-[#FFF8E5] text-amber-deep' },
    { title: 'Active Subscriptions', value: data?.activeSubscriptions,  icon: CreditCard,   accent: 'bg-[#F0EEFF] text-[#7C5CBF]' },
    { title: 'Pending KYC',          value: data?.pendingKYC,           icon: AlertCircle,  accent: 'bg-[#FFF3E0] text-[#E8941A]' },
    { title: 'Cancel Rate',          value: data?.cancelRate ? `${data.cancelRate}%` : null, icon: TrendingDown, accent: 'bg-[#FBE9E5] text-[#DC4E37]' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy font-display">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Live platform overview</p>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>
    </div>
  );
}
