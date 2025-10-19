import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AutoSchedulingResultStatus} from "@/src/types/enums";
import {getYearAndWeek} from '@/src/utils/dateUtils';

export interface TrainingSession {
  memberId: string;
  memberName: string;
  memberPhone: string;
  hour: number;
  day: string;
  weekOfYear: number; // 연도 기준 주차 (1-52)
  autoSchedulingResultLineId?: number; // Individual schedule item ID for cancellation
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
  weekScheduleStatus: { [week: number]: AutoSchedulingResultStatus };

  // Actions
  setTrainingSessions: (sessions: TrainingSession[]) => void;
  setCurrentWeek: (week: number) => void;
  setTotalWeeks: (weeks: number) => void;
  setSelectedMember: (memberId: string | null) => void;

  // Helper functions
  getSessionsForWeek: (week: number) => TrainingSession[];
  getCurrentWeekSessions: () => TrainingSession[];
  canEditWeek: (week: number) => boolean;
  isCurrentWeek: (week: number) => boolean;
  isPastWeek: (week: number) => boolean;
  isNextWeek: (week: number) => boolean;
  resetWeek: (week: number) => void;
  resetTraining: () => void;
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      trainingSessions: [],
      currentWeek: 0, // persist에서 제외되므로 초기값은 의미 없음
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

      getSessionsForWeek: (week) => {
        return get().trainingSessions.filter(session => session.weekOfYear === week);
      },

      getCurrentWeekSessions: () => {
        const state = get();
        return state.trainingSessions.filter(session => session.weekOfYear === state.currentWeek);
      },

      canEditWeek: (week) => {
        // 이번 주는 수정 불가능
        const { targetWeekOfYear } = getYearAndWeek(new Date());
        return week !== targetWeekOfYear;
      },

      isCurrentWeek: (week) => {
        const { targetWeekOfYear } = getYearAndWeek(new Date());
        return week === targetWeekOfYear;
      },

      isPastWeek: (week) => {
        const { targetWeekOfYear } = getYearAndWeek(new Date());
        return week < targetWeekOfYear;
      },

      isNextWeek: (week) => {
        const { targetWeekOfYear } = getYearAndWeek(new Date());
        return week === targetWeekOfYear + 1;
      },

      resetWeek: (week) => {
        set((state) => ({
          weekScheduleStatus: {
            ...state.weekScheduleStatus,
            [week]: AutoSchedulingResultStatus.PLACEHOLDER,
          }
        }));
      },

      resetTraining: () => {
        set({
          trainingSessions: [],
          currentWeek: 0,
          selectedMember: null,
          weekScheduleStatus: {},
        });
      },
    }),
    {
      name: 'training-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // currentWeek는 persist에서 제외 (항상 현재 실제 주차로 시작)
      partialize: (state) => ({
        trainingSessions: state.trainingSessions,
        totalWeeks: state.totalWeeks,
        selectedMember: state.selectedMember,
        weekScheduleStatus: state.weekScheduleStatus,
      }),
    }
  )
);
