import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import api from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  setSession: (user: User, token: string) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  requestMagicLink: (email: string) => Promise<{ message: string; delivered: boolean }>;
  verifyMagicLink: (token: string) => Promise<void>;
  verifyEmailOtp: (email: string, code: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'STUDENT';
  }) => Promise<{ message: string; delivered: boolean }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      setSession: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      fetchMe: async () => {
        if (!get().token) return;
        set({ loading: true });
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.data, loading: false });
        } catch {
          set({ user: null, token: null, loading: false });
        }
      },
      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        set({ user: data.data.user, token: String(data.data.token) });
      },
      requestMagicLink: async (email) => {
        const { data } = await api.post('/auth/magic-link', { email });
        return {
          message: String(data.data.message ?? 'Проверьте email'),
          delivered: data.data.delivered !== false,
        };
      },
      verifyMagicLink: async (token) => {
        const { data } = await api.post('/auth/verify-magic-link', { token });
        set({ user: data.data.user, token: String(data.data.token) });
      },
      verifyEmailOtp: async (email, code) => {
        const { data } = await api.post('/auth/verify-otp', { email, code });
        set({ user: data.data.user, token: String(data.data.token) });
      },
      register: async (payload) => {
        const { data } = await api.post('/auth/register', payload);
        return {
          message: String(data.data.message ?? 'Проверьте email'),
          delivered: data.data.delivered !== false,
        };
      },
    }),
    { name: 'educrm-auth' },
  ),
);
