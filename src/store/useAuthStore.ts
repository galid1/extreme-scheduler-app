import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccountType, ScheduleStatus } from '@/src/types/user';
import { Account, Trainer, Member } from '@/src/types/api';

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
  accountId: number | null;
  // Full account data
  account: Account | null;
  trainer: Trainer | null;
  member: Member | null;
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
  setAccountData: (data: {
    account: Account;
    trainer?: Trainer;
    member?: Member;
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
        // c31a080a-b7a9-47d9-9c5a-8b4125816ac2 trainer
        // 초기값은 null로 설정 - AsyncStorage에서 로드됨
      token: "c31a080a-b7a9-47d9-9c5a-8b4125816ac2",
      isAuthenticated: true,
      phoneNumber: null,
      name: null,
      accountType: 'MEMBER',
      accountId: null,
      account: null,
      trainer: null,
      member: null,
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

      setAccountData: (data) => {
        set({
          account: data.account,
          trainer: data.trainer || null,
          member: data.member || null,
          accountId: data.account.accountId,
          name: data.account.name,
          phoneNumber: data.account.phoneNumber,
          accountType: data.account.accountType,
          // Set trainerAccountId if member has an assigned trainer
          trainerAccountId: data.member?.assignedTrainerAccountId?.toString() || null,
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
          accountId: null,
          account: null,
          trainer: null,
          member: null,
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
