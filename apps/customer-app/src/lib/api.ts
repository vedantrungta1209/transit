import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://transit-api.transitco.in';

export const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('accessToken');
    }
    return Promise.reject(err);
  }
);
