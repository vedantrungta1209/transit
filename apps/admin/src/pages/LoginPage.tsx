import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const TransitMark = () => (
  <svg viewBox="0 0 120 120" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="108" height="108" rx="28" fill="#0F2B5B"/>
    <rect x="32" y="33" width="56" height="13.5" rx="6.75" fill="#F7B32B"/>
    <path d="M53 44 L67 44 L67 70 L78 86 L70 90 L60 80 L50 90 L42 86 L53 70 Z" fill="#F7B32B"/>
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin/login', { email, password });
      setAuth(data.data.accessToken, data.data.admin);
      navigate('/dashboard');
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <TransitMark />
          <span className="text-white font-display text-xl font-bold tracking-tight">Transit</span>
        </div>
        <div>
          <p className="text-[#F7B32B] text-sm font-medium uppercase tracking-widest mb-4">Admin Console</p>
          <h2 className="text-white font-display text-4xl font-bold leading-tight mb-4">
            Manage rides,<br/>drivers & fares.
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            One dashboard to oversee the entire Transit platform — KYC approvals, subscription plans, fare pricing, and live analytics.
          </p>
        </div>
        <p className="text-white/25 text-xs">Ride. Earn. Freedom. — transitco.in</p>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <TransitMark />
            <span className="font-display text-xl font-bold text-navy">Transit</span>
          </div>

          <h1 className="text-2xl font-bold text-navy font-display mb-1">Sign in</h1>
          <p className="text-muted text-sm mb-8">Enter your admin credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-navy/70 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@transitco.in" required
                className="w-full bg-white border rounded-xl px-4 py-3 text-sm text-navy placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-amber shadow-t1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy/70 mb-1.5 uppercase tracking-wide">Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full bg-white border rounded-xl px-4 py-3 text-sm text-navy placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-amber shadow-t1"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-amber text-navy-900 py-3 rounded-xl text-sm font-bold hover:bg-amber-deep transition-colors disabled:opacity-50 shadow-t1 mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
