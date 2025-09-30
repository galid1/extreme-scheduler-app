import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Account,
  TrainerResponse,
  MemberResponse,
  TrainerScheduleStatus,
  MemberScheduleStatus
} from '@/src/types/api';
import { useConfigStore } from './useConfigStore';
import { mockAccount, mockTrainer, mockMember, mockMemberAccount, mockSavedSchedule } from '@/src/mock/mockData';

type TimeSlotState = 'none' | 'once' | 'recurring';

interface TimeSlotSelection {
  hour: number;
  state: TimeSlotState;
}

interface AuthState {
  token: string | null;
  phoneNumber: string | null;
  tempToken: string | null;

  // Full account data from API
  account: Account | null;
  trainer: TrainerResponse | null;
  member: MemberResponse | null;

  // Schedule data for both member and trainer
  savedSchedule: { [key: string]: TimeSlotSelection[] };

  // Actions
  setToken: (token: string) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  setTempToken: (tempToken: string) => void;
  setUserInfo: (info: { name: string; accountType: string }) => void;
  setAccountData: (data: {
    account: Account;
    trainer?: TrainerResponse;
    member?: MemberResponse;
  }) => void;
  setSavedSchedule: (schedule: { [key: string]: TimeSlotSelection[] }) => void;
  setTrainerAccountId: (id: number | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기값은 null로 설정 - AsyncStorage에서 로드됨
      token: null,
      phoneNumber: null,
      tempToken: null,
      account: null,
      trainer: null,
      member: null,
      savedSchedule: {},

      setToken: (token) => {
        set({ token });
      },

      setPhoneNumber: (phoneNumber) => {
        set({ phoneNumber });
      },

      setTempToken: (tempToken) => {
        set({ tempToken });
      },

      setUserInfo: (info) => {
        // This is a placeholder for compatibility
        console.log('User info set:', info);
      },

      setAccountData: (data) => {
        set({
          account: data.account,
          trainer: data.trainer || null,
          member: data.member || null,
        });
      },

      setSavedSchedule: (schedule) => {
        set({ savedSchedule: schedule });
      },

      setTrainerAccountId: (id) => {
        set((state) => {
          if (state.member) {
            return {
              member: {
                ...state.member,
                trainerAccountId: id || undefined
              }
            };
          }
          return {};
        });
      },

      logout: () => {
        set({
          token: null,
          phoneNumber: null,
          tempToken: null,
          account: null,
          trainer: null,
          member: null,
          savedSchedule: {},
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper selectors
export const useAccountType = () => useAuthStore((state) => state.account?.accountType);
export const useName = () => useAuthStore((state) => state.account?.privacyInfo?.name);
export const useStoredPhoneNumber = () => useAuthStore((state) => state.account?.privacyInfo?.phoneNumber);
export const useAccountId = () => useAuthStore((state) => state.account?.id);
export const useTrainerAccountId = () => useAuthStore((state) => state.member?.trainerAccountId);
export const useScheduleStatus = () => useAuthStore((state) => {
  if (state.trainer) {
    return state.trainer.scheduleStatus;
  } else if (state.member) {
    return state.member.scheduleStatus;
  }
  return null;
});
export const useNotificationSent = () => useAuthStore((state) => false); // Placeholder for now
