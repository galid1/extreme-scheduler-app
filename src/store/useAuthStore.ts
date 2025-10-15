import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Account, MemberResponse, TrainerResponse, WeeklyScheduleRegistrationStatusResponse} from '@/src/types/api';
import apiClient from '@/src/services/api/client';

interface AuthState {
  authToken: string | null;
  phoneNumber: string | null;
  tempTokenForSignUp: string | null;

  // Full account data from API
  account: Account | null;
  trainer: TrainerResponse | null;
  member: MemberResponse | null;

  // Assigned trainer data for member
  assignedTrainer: any | null;

  // Weekly schedule registration status for member
  weeklyScheduleRegistration: WeeklyScheduleRegistrationStatusResponse | null;

  // Push token info
  pushToken: string | null;

  // Actions
  setAuthToken: (token: string) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  setTempTokenForSignUp: (tempToken: string) => void;
  setAccountData: (data: {
    account: Account;
    trainer?: TrainerResponse;
    member?: MemberResponse;
  }) => void;
  setTrainerAccountId: (id: number | null) => void;
  setAssignedTrainer: (trainer: any | null) => void;
  setWeeklyScheduleRegistration: (status: WeeklyScheduleRegistrationStatusResponse | null) => void;
  setPushToken: (pushToken: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기값은 null로 설정 - AsyncStorage에서 로드됨
      authToken: null,
      phoneNumber: null,
      tempTokenForSignUp: null,
      account: null,
      trainer: null,
      member: null,
      assignedTrainer: null,
      weeklyScheduleRegistration: null,
      pushToken: null,

      setAuthToken: (token) => {
        set({ authToken: token });
        // Also update API client token for HTTP requests
        apiClient.setAuthToken(token);
      },

      setPhoneNumber: (phoneNumber) => {
        set({ phoneNumber });
      },

      setTempTokenForSignUp: (tempToken) => {
        set({ tempTokenForSignUp: tempToken });
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

      setWeeklyScheduleRegistration: (status) => {
        set({ weeklyScheduleRegistration: status });
      },

      setPushToken: (pushToken) => {
        set({ pushToken: pushToken });
      },

      logout: async () => {
        // Store 상태 초기화
        set({
          authToken: null,
          phoneNumber: null,
          tempTokenForSignUp: null,
          account: null,
          trainer: null,
          member: null,
          assignedTrainer: null,
          weeklyScheduleRegistration: null,
          pushToken: null,
        });

        // API client token 제거
        apiClient.setAuthToken(null);

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
