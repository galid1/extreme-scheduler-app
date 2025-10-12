import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AssignmentRequestDto } from '@/src/types/api';

interface AssignmentState {
  assignmentRequests: AssignmentRequestDto[];
  isLoadingRequests: boolean;
  lastFetchTime: Date | null;

  // Actions
  setAssignmentRequests: (requests: AssignmentRequestDto[]) => void;
  setIsLoadingRequests: (loading: boolean) => void;
  updateRequestStatus: (requestId: number, status: 'ACCEPTED' | 'REJECTED', rejectReason?: string) => void;
  clearAssignmentRequests: () => void;
}

export const useAssignmentStore = create<AssignmentState>()(
  persist(
    (set) => ({
      assignmentRequests: [],
      isLoadingRequests: false,
      lastFetchTime: null,

      setAssignmentRequests: (requests) => {
        set({
          assignmentRequests: requests,
          lastFetchTime: new Date()
        });
      },

      setIsLoadingRequests: (loading) => {
        set({ isLoadingRequests: loading });
      },

      updateRequestStatus: (requestId, status, rejectReason) => {
        set((state) => ({
          assignmentRequests: state.assignmentRequests.map((req) =>
            req.requestId === requestId
              ? {
                  ...req,
                  status,
                  ...(rejectReason && { rejectReason })
                }
              : req
          ),
        }));
      },

      clearAssignmentRequests: () => {
        set({
          assignmentRequests: [],
          lastFetchTime: null
        });
      },
    }),
    {
      name: 'assignment-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        assignmentRequests: state.assignmentRequests,
        lastFetchTime: state.lastFetchTime,
      }),
    }
  )
);
