import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccountType, ScheduleStatus } from '@/src/types/user';

type TimeSlotState = 'none' | 'once' | 'recurring';

interface TimeSlotSelection {
  hour: number;
  state: TimeSlotState;
}

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

  // Schedule data for both member and trainer
  savedSchedule: { [key: string]: TimeSlotSelection[] };

  // Notification status
  notificationSent: boolean;

  // Actions
  setToken: (token: string) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  setUserInfo: (info: {
    name: string;
    accountType: AccountType;
  }) => void;
  setTrainerAccountId: (id: string | null) => void;
  setScheduleStatus: (status: ScheduleStatus) => void;
  setSavedSchedule: (schedule: { [key: string]: TimeSlotSelection[] }) => void;
  setNotificationSent: (sent: boolean) => void;
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
      savedSchedule: {},
      notificationSent: false,

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
          // Reset schedule when switching accounts
          savedSchedule: {},
        });
      },

      setTrainerAccountId: (id) => {
        set({ trainerAccountId: id });
      },

      setScheduleStatus: (status) => {
        set({
          scheduleStatus: status,
          // Reset notification status when schedule status changes to READY
          notificationSent: status === 'READY' ? false : get().notificationSent
        });
      },

      setSavedSchedule: (schedule) => {
        set({ savedSchedule: schedule });
      },

      setNotificationSent: (sent) => {
        set({ notificationSent: sent });
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
          savedSchedule: {},
          notificationSent: false,
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