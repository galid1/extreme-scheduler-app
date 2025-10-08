import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Account,
    MemberFixedAutoSchedulingScheduleDetail,
    MemberResponse,
    TrainerResponse,
    WeeklyScheduleRegistrationStatusResponse
} from '@/src/types/api';

interface AuthState {
  token: string | null;
  phoneNumber: string | null;
  tempToken: string | null;

  // Full account data from API
  account: Account | null;
  trainer: TrainerResponse | null;
  member: MemberResponse | null;

  // Assigned trainer data for member
  assignedTrainer: any | null;

  // Auto scheduling results for member
  autoSchedulingResults: MemberFixedAutoSchedulingScheduleDetail[] | null;

  // Weekly schedule registration status for member
  weeklyScheduleRegistration: WeeklyScheduleRegistrationStatusResponse | null;

  // Actions
  setToken: (token: string) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  setTempToken: (tempToken: string) => void;
  setAccountData: (data: {
    account: Account;
    trainer?: TrainerResponse;
    member?: MemberResponse;
  }) => void;
  setTrainerAccountId: (id: number | null) => void;
  setAssignedTrainer: (trainer: any | null) => void;
  setAutoSchedulingResults: (results: MemberFixedAutoSchedulingScheduleDetail[] | null) => void;
  setWeeklyScheduleRegistration: (status: WeeklyScheduleRegistrationStatusResponse | null) => void;
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
      assignedTrainer: null,
      autoSchedulingResults: null,
      weeklyScheduleRegistration: null,

      setToken: (token) => {
        set({ token });
      },

      setPhoneNumber: (phoneNumber) => {
        set({ phoneNumber });
      },

      setTempToken: (tempToken) => {
        set({ tempToken });
      },

      setAccountData: (data) => {
        set({
          account: data.account,
          trainer: data.trainer || null,
          member: data.member || null,
        });
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

      setAssignedTrainer: (trainer) => {
        set({ assignedTrainer: trainer });
      },

      setAutoSchedulingResults: (results) => {
        set({ autoSchedulingResults: results });
      },

      setWeeklyScheduleRegistration: (status) => {
        set({ weeklyScheduleRegistration: status });
      },

      logout: async () => {
        // Store 상태 초기화
        set({
          token: null,
          phoneNumber: null,
          tempToken: null,
          account: null,
          trainer: null,
          member: null,
          assignedTrainer: null,
          autoSchedulingResults: null,
          weeklyScheduleRegistration: null,
        });

        // AsyncStorage에서도 제거
        try {
          await AsyncStorage.removeItem('auth-storage');
          console.log('AsyncStorage cleared successfully');
        } catch (error) {
          console.error('Failed to clear auth storage:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
