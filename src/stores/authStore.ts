import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      authMode: 'login',
      
      setAuthMode: (mode) => set({ authMode: mode }),
      
      login: async (username: string, password: string) => {
        // 模拟登录验证
        if (username && password) {
          set({
            user: {
              id: 'user_001',
              username,
              email: `${username}@example.com`,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
              createdAt: new Date().toISOString(),
            },
            isLoggedIn: true,
          });
          return true;
        }
        return false;
      },
      
      register: async (username: string, email: string, password: string) => {
        if (username && email && password) {
          set({
            user: {
              id: 'user_' + Date.now(),
              username,
              email,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
              createdAt: new Date().toISOString(),
            },
            isLoggedIn: true,
          });
          return true;
        }
        return false;
      },
      
      logout: () => {
        set({ user: null, isLoggedIn: false });
      },
    }),
    {
      name: 'nexusai-auth',
      partialize: (state) => ({ user: state.user, isLoggedIn: state.isLoggedIn }),
    }
  )
);
