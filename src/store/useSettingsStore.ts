import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface SettingsStore {
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
  notificationsEnabled: boolean;
  defaultReminderMinutes: number;
  weekStartsOn: 0 | 1 | 6; // 0: Sunday, 1: Monday, 6: Saturday
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: 'ko' | 'en') => void;
  toggleNotifications: () => void;
  setDefaultReminder: (minutes: number) => void;
  setWeekStartsOn: (day: 0 | 1 | 6) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        theme: 'system',
        language: 'ko',
        notificationsEnabled: true,
        defaultReminderMinutes: 15,
        weekStartsOn: 1,

        setTheme: (theme) => set({ theme }),
        setLanguage: (language) => set({ language }),
        toggleNotifications: () =>
          set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
        setDefaultReminder: (minutes) => set({ defaultReminderMinutes: minutes }),
        setWeekStartsOn: (day) => set({ weekStartsOn: day }),
      }),
      {
        name: 'settings-storage',
      }
    )
  )
);
