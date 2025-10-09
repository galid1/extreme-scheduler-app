import { create } from 'zustand';

interface SchedulingEventState {
  shouldRefresh: number;
  hasNextWeekScheduling: boolean;
  triggerRefresh: () => void;
  setHasNextWeekScheduling: (exists: boolean) => void;
}

export const useSchedulingEventStore = create<SchedulingEventState>((set) => ({
  shouldRefresh: 0,
  hasNextWeekScheduling: false,

  triggerRefresh: () => {
    set((state) => ({ shouldRefresh: state.shouldRefresh + 1 }));
  },

  setHasNextWeekScheduling: (exists: boolean) => {
    set({ hasNextWeekScheduling: exists });
  },
}));
