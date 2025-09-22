import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccountType, ScheduleStatus } from '@/src/types/user';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  phoneNumber: string | null;
  name: string | null;
  accountType: AccountType;
  // Schedule status for both member and trainer
  scheduleStatus: ScheduleStatus;

  // Member specific fields
  trainerAccountId: string | null;

  // Actions
  setToken: (token: string) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  setUserInfo: (info: {
    name: string;
    accountType: AccountType;
  }) => void;
  setTrainerAccountId: (id: string | null) => void;
  setScheduleStatus: (status: ScheduleStatus) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      isAuthenticated: false,
      phoneNumber: null,
      name: null,
      accountType: 'MEMBER',
      trainerAccountId: null,
      scheduleStatus: 'NOT_READY',

      setToken: (token) => {
        set({ token, isAuthenticated: true });
      },

      setPhoneNumber: (phoneNumber) => {
        set({ phoneNumber });
      },

      setUserInfo: (info) => {
        set({
          name: info.name,
          accountType: info.accountType,
          // Reset member-specific fields if switching to trainer
          trainerAccountId: info.accountType === 'TRAINER' ? null : get().trainerAccountId,
          // Both member and trainer have scheduleStatus
          scheduleStatus: 'NOT_READY',
        });
      },

      setTrainerAccountId: (id) => {
        set({ trainerAccountId: id });
      },

      setScheduleStatus: (status) => {
        set({ scheduleStatus: status });
      },

      logout: () => {
        set({
          token: null,
          isAuthenticated: false,
          phoneNumber: null,
          name: null,
          accountType: 'MEMBER',
          trainerAccountId: null,
          scheduleStatus: 'NOT_READY',
        });
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