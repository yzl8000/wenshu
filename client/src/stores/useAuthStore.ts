import { create } from 'zustand';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  referralCode?: string;
  createdAt: string;
}

interface ReferralStats {
  code: string;
  count: number;
  users: { id: string; name: string; email: string; joinedAt: string }[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  referralStats: ReferralStats | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  fetchReferralStats: () => Promise<void>;
  updateProfile: (data: Partial<User> & { currentPassword?: string; newPassword?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })(),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  referralStats: null,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, isAuthenticated: true });
  },

  register: async (email, password, name, referralCode) => {
    const { data } = await api.post('/auth/register', { email, password, name, referralCode });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, referralStats: null });
  },

  fetchUser: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchReferralStats: async () => {
    try {
      const { data } = await api.get('/referrals/stats');
      set({ referralStats: data });
    } catch {
      // ignore
    }
  },

  updateProfile: async (profileData) => {
    const { data } = await api.put('/auth/me', profileData);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user });
  },
}));
