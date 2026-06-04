import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  driver: any | null;
  token: string | null;
  setAuth: (token: string, driver: any) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  driver: null,
  token: null,
  setAuth: async (token, driver) => {
    await SecureStore.setItemAsync('accessToken', token);
    await SecureStore.setItemAsync('driver', JSON.stringify(driver));
    set({ token, driver });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('driver');
    set({ token: null, driver: null });
  },
  hydrate: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    const driverStr = await SecureStore.getItemAsync('driver');
    if (token && driverStr) set({ token, driver: JSON.parse(driverStr) });
  },
}));
