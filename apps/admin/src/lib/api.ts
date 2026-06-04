import axios from 'axios';
import toast from 'react-hot-toast';

export const api = axios.create({ baseURL: '/api', timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    } else {
      toast.error(err.response?.data?.error || 'Something went wrong');
    }
    return Promise.reject(err);
  }
);
