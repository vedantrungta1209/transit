import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Car, Users, IndianRupee, CreditCard, AlertCircle, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white rounded-xl border p-6">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm text-gray-500">{title}</p>
      <div className={`p-2 rounded-lg ${color}`}><Icon size={20} /></div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/admin/dashboard/stats').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const stats = [
    { title: "Today's Rides", value: data?.todayRides ?? '—', icon: Car, color: 'bg-blue-50 text-blue-600' },
    { title: 'Active Drivers', value: data?.activeDrivers ?? '—', icon: Users, color: 'bg-green-50 text-green-600' },
    { title: "Revenue Today", value: data?.revenueToday ? `₹${data.revenueToday.toLocaleString('en-IN')}` : '—', icon: IndianRupee, color: 'bg-yellow-50 text-yellow-600' },
    { title: 'Active Subscriptions', value: data?.activeSubscriptions ?? '—', icon: CreditCard, color: 'bg-purple-50 text-purple-600' },
    { title: 'Pending KYC', value: data?.pendingKYC ?? '—', icon: AlertCircle, color: 'bg-orange-50 text-orange-600' },
    { title: 'Cancel Rate', value: data?.cancelRate ? `${data.cancelRate}%` : '—', icon: TrendingDown, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-6">
        {stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>
    </div>
  );
}
