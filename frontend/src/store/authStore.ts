import { create } from 'zustand';
import { User } from '../types';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  checkAuth: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ otp_required?: boolean }>;
  verifyOtp: (code: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  checkAuth: async () => {
    try {
      const { data } = await authApi.getCurrentUser();
      set({ user: data, isAuthenticated: true, loading: false });
    } catch {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  login: async (username, password) => {
    const { data } = await authApi.login(username, password);
    if (data.otp_required) {
      return { otp_required: true };
    }
    set({ user: data, isAuthenticated: true });
    return {};
  },

  verifyOtp: async (code) => {
    const { data } = await authApi.verifyOtp(code);
    set({ user: data, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear local state even if the API call fails
    }
    set({ user: null, isAuthenticated: false });
  },
}));
