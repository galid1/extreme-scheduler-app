import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MockDataManager } from '@/src/mock/mockDataManager';

interface ConfigState {
  environment: 'local' | 'development' | 'production';
  mockMode: boolean;
  mockRole: 'trainer' | 'member' | null;
  apiBaseUrl: string;
  skipStates: {
    phoneAuth: boolean;
    signup: boolean;
  };

  // Actions
  setEnvironment: (env: 'local' | 'development' | 'production') => void;
  toggleMockMode: () => void;
  setMockMode: (enabled: boolean, role?: 'trainer' | 'member') => void;
  enableMockMode: (role: 'trainer' | 'member') => Promise<void>;
  disableMockMode: () => void;
  switchMockRole: (role: 'trainer' | 'member') => Promise<void>;
  getIsLocalEnvironment: () => boolean;
  setSkipState: (screen: 'phoneAuth' | 'signup', value: boolean) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      // Default to local environment for development
      environment: 'local',
      mockMode: false,
      mockRole: null,
      apiBaseUrl: 'http://localhost:8080',
      skipStates: {
        phoneAuth: false,
        signup: false,
      },

      setEnvironment: (env) => {
        let apiBaseUrl = 'http://localhost:8080';
        if (env === 'development') {
          apiBaseUrl = 'https://dev-api.example.com';
        } else if (env === 'production') {
          apiBaseUrl = 'https://api.example.com';
        }

        set({
          environment: env,
          apiBaseUrl,
          // Disable mock mode for non-local environments
          mockMode: env === 'local' ? get().mockMode : false
        });
      },

      toggleMockMode: () => {
        const state = get();
        if (state.environment === 'local') {
          const newMockMode = !state.mockMode;
          set({ mockMode: newMockMode });
          if (!newMockMode) {
            MockDataManager.clearAllStores();
            set({ mockRole: null });
          }
        }
      },

      setMockMode: (enabled, role) => {
        const state = get();
        if (state.environment === 'local') {
          set({ mockMode: enabled, mockRole: enabled ? (role || state.mockRole) : null });
          if (!enabled) {
            MockDataManager.clearAllStores();
          }
        }
      },

      enableMockMode: async (role) => {
        const state = get();
        if (state.environment === 'local') {
          await MockDataManager.initializeAllStores(role);
          set({ mockMode: true, mockRole: role });
        }
      },

      disableMockMode: () => {
        const state = get();
        if (state.environment === 'local') {
          MockDataManager.clearAllStores();
          set({ mockMode: false, mockRole: null });
        }
      },

      switchMockRole: async (role) => {
        const state = get();
        if (state.environment === 'local' && state.mockMode) {
          await MockDataManager.switchRole(role);
          set({ mockRole: role });
        }
      },

      getIsLocalEnvironment: () => {
        return get().environment === 'local';
      },

      setSkipState: (screen, value) => {
        set((state) => ({
          skipStates: {
            ...state.skipStates,
            [screen]: value,
          },
        }));
      },
    }),
    {
      name: 'config-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);