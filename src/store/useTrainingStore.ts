import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConfigStore } from './useConfigStore';
import { mockTrainingSessions } from '@/src/mock/mockData';
import {AutoSchedulingResultStatus, WeekScheduleStatus} from "@/src/types/enums";

export interface TrainingSession {
  memberId: string;
  memberName: string;
  memberPhone: string;
  hour: number;
  day: string;
  weekOfYear: number; // 연도 기준 주차 (1-52)
}

interface TrainingState {
  // 트레이닝 세션 데이터
  trainingSessions: TrainingSession[];

  // 현재 선택된 주차
  currentWeek: number;

  // 전체 주차 수
  totalWeeks: number;

  // 선택된 회원
  selectedMember: string | null;

  // 주차별 자동 스케줄링 일정 상태
  weekScheduleStatus: { [week: number]: WeekScheduleStatus };

  // Actions
  setTrainingSessions: (sessions: TrainingSession[]) => void;
  setCurrentWeek: (week: number) => void;
  setTotalWeeks: (weeks: number) => void;
  setSelectedMember: (memberId: string | null) => void;
  setWeekScheduleStatus: (week: number, status: WeekScheduleStatus) => void;

  // Helper functions
  getSessionsForWeek: (week: number) => TrainingSession[];
  getCurrentWeekSessions: () => TrainingSession[];
  canEditWeek: (week: number) => boolean;
  canSendNotification: (week: number) => boolean;
  isCurrentWeek: (week: number) => boolean;
  isPastWeek: (week: number) => boolean;
  isNextWeek: (week: number) => boolean;
  resetWeek: (week: number) => void;
  resetTraining: () => void;
  loadMockData: () => void;
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      trainingSessions: [],
      currentWeek: 1,
      totalWeeks: 12, // 기본 12주 프로그램
      selectedMember: null,
      weekScheduleStatus: {},

      setTrainingSessions: (sessions) => {
        set({ trainingSessions: sessions });
      },

      setCurrentWeek: (week) => {
        set({ currentWeek: week });
      },

      setTotalWeeks: (weeks) => {
        set({ totalWeeks: weeks });
      },

      setSelectedMember: (memberId) => {
        set({ selectedMember: memberId });
      },

      setWeekScheduleStatus: (week, status) => {
        set((state) => ({
          weekScheduleStatus: {
            ...state.weekScheduleStatus,
            [week]: status,
          }
        }));
      },

      getSessionsForWeek: (week) => {
        return get().trainingSessions.filter(session => session.weekOfYear === week);
      },

      getCurrentWeekSessions: () => {
        const state = get();
        return state.trainingSessions.filter(session => session.weekOfYear === state.currentWeek);
      },

      canEditWeek: (week) => {
        // 이번 주는 수정 불가능
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const daysSinceStart = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
        const currentWeekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
        return week !== currentWeekNumber;
      },

      canSendNotification: (week) => {
        const state = get();
        // 이번 주는 알림 발송 불가능
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const daysSinceStart = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
        const currentWeekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
        if (week === currentWeekNumber) return false;

        // 이미 발송된 주차는 불가능
        return !state.weekScheduleStatus[week];
      },

      isCurrentWeek: (week) => {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const daysSinceStart = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
        const currentWeekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
        return week === currentWeekNumber;
      },

      isPastWeek: (week) => {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const daysSinceStart = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
        const currentWeekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
        return week < currentWeekNumber;
      },

      isNextWeek: (week) => {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const daysSinceStart = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
        const currentWeekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
        return week === currentWeekNumber + 1;
      },

      resetWeek: (week) => {
        set((state) => ({
          weekScheduleStatus: {
            ...state.weekScheduleStatus,
            [week]: AutoSchedulingResultStatus.NOT_FIXED,
          }
        }));
      },

      resetTraining: () => {
        set({
          trainingSessions: [],
          currentWeek: 1,
          selectedMember: null,
          weekScheduleStatus: {},
        });
      },

      loadMockData: () => {
        set({
          trainingSessions: mockTrainingSessions,
          currentWeek: 3,
          totalWeeks: 12,
          weekScheduleStatus: { 1: true, 2: true },
        });
      },
    }),
    {
      name: 'training-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
