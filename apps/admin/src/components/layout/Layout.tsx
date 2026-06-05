import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Car, MapPin, BarChart3, CreditCard, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';

const TransitLogo = () => (
  <svg viewBox="0 0 120 120" width="34" height="34" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="108" height="108" rx="28" fill="#0F2B5B"/>
    <rect x="6" y="6" width="108" height="108" rx="28" fill="url(#lg)" opacity="0.6"/>
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#163B78"/>
        <stop offset="1" stopColor="#071633"/>
      </linearGradient>
    </defs>
    <rect x="32" y="33" width="56" height="13.5" rx="6.75" fill="#F7B32B"/>
    <path d="M53 44 L67 44 L67 70 L78 86 L70 90 L60 80 L50 90 L42 86 L53 70 Z" fill="#F7B32B"/>
  </svg>
);

const nav = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/subscriptions', icon: CreditCard,       label: 'Subscriptions' },
  { to: '/drivers',       icon: Users,            label: 'Drivers' },
  { to: '/rides',         icon: Car,              label: 'Rides' },
  { to: '/fare-pricing',  icon: MapPin,           label: 'Fare Pricing' },
  { to: '/analytics',     icon: BarChart3,        label: 'Analytics' },
];

export default function Layout() {
  const { admin, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-paper">
      <aside className="w-64 bg-navy flex flex-col flex-shrink-0">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <TransitLogo />
          <div>
            <h1 className="text-[15px] font-bold text-white font-display leading-tight tracking-tight">Transit</h1>
            <p className="text-xs text-white/45 leading-tight mt-0.5">{admin?.name || 'Admin'}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[rgba(247,179,43,0.15)] text-[#F7B32B]'
                    : 'text-white/55 hover:text-white/90 hover:bg-white/8'
                }`
              }
            >
              <Icon size={17} strokeWidth={1.7} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium text-white/40 truncate">{admin?.email}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/45 hover:text-white/80 hover:bg-white/8 w-full transition-colors"
          >
            <LogOut size={17} strokeWidth={1.7} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
