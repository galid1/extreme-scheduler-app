import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  phoneNumber: string | null;
  setToken: (token: string) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      isAuthenticated: false,
      phoneNumber: null,

      setToken: (token) => {
        set({ token, isAuthenticated: true });
      },

      setPhoneNumber: (phoneNumber) => {
        set({ phoneNumber });
      },

      logout: () => {
        set({ token: null, isAuthenticated: false, phoneNumber: null });
      },

      checkAuth: () => {
        const state = get();
        return !!state.token && state.isAuthenticated;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);