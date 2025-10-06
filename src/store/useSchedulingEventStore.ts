import { create } from 'zustand';

interface SchedulingEventState {
  shouldRefresh: number;
  triggerRefresh: () => void;
}

export const useSchedulingEventStore = create<SchedulingEventState>((set) => ({
  shouldRefresh: 0,

  triggerRefresh: () => {
    set((state) => ({ shouldRefresh: state.shouldRefresh + 1 }));
  },
}));
