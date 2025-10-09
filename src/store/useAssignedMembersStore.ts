import { create } from 'zustand';
import { MemberWithSchedulesResponse } from '@/src/types/api';

interface AssignedMembersState {
  members: MemberWithSchedulesResponse[];
  lastFetched: Date | null;
  setMembers: (members: MemberWithSchedulesResponse[]) => void;
  shouldRefetch: () => boolean;
}

export const useAssignedMembersStore = create<AssignedMembersState>((set, get) => ({
  members: [],
  lastFetched: null,

  setMembers: (members) => set({ members, lastFetched: new Date() }),

  // 5분이 지났으면 다시 fetch
  shouldRefetch: () => {
    const { lastFetched } = get();
    if (!lastFetched) return true;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastFetched < fiveMinutesAgo;
  },
}));
