import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  admin: any | null;
  setAuth: (token: string, admin: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      setAuth: (token, admin) => { localStorage.setItem('accessToken', token); set({ token, admin }); },
      logout: () => { localStorage.removeItem('accessToken'); set({ token: null, admin: null }); },
    }),
    { name: 'transit-admin-auth' }
  )
);
