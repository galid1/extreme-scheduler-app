import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConfigState {
  environment: 'local' | 'development' | 'production';
  apiBaseUrl: string;
  // Actions
  setEnvironment: (env: 'local' | 'development' | 'production') => void;
  getIsLocalEnvironment: () => boolean;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      // Default to local environment for development
      environment: 'local',
      apiBaseUrl: 'http://localhost:8080',
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
        });
      },

      getIsLocalEnvironment: () => {
        return get().environment === 'local';
      },

    }),
    {
      name: 'config-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
