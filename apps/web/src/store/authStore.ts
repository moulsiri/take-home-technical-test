import { create } from 'zustand';
import { fetchApi } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isVerified?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
  checkAuth: async () => {
    try {
      const res = await fetchApi('/auth/me');
      if (res.ok) {
        const user = await res.json();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
