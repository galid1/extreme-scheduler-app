import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Schedule {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  category?: string;
  color?: string;
  isRecurring?: boolean;
  recurringPattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
  reminder?: {
    type: 'minutes' | 'hours' | 'days';
    value: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ScheduleStore {
  schedules: Schedule[];
  selectedDate: Date;
  addSchedule: (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSchedule: (id: string, schedule: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  setSelectedDate: (date: Date) => void;
  getSchedulesByDate: (date: Date) => Schedule[];
}

export const useScheduleStore = create<ScheduleStore>()(
  devtools(
    persist(
      (set, get) => ({
        schedules: [],
        selectedDate: new Date(),

        addSchedule: (scheduleData) => {
          const newSchedule: Schedule = {
            ...scheduleData,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set((state) => ({
            schedules: [...state.schedules, newSchedule],
          }));
        },

        updateSchedule: (id, scheduleData) => {
          set((state) => ({
            schedules: state.schedules.map((schedule) =>
              schedule.id === id
                ? { ...schedule, ...scheduleData, updatedAt: new Date() }
                : schedule
            ),
          }));
        },

        deleteSchedule: (id) => {
          set((state) => ({
            schedules: state.schedules.filter((schedule) => schedule.id !== id),
          }));
        },

        setSelectedDate: (date) => {
          set({ selectedDate: date });
        },

        getSchedulesByDate: (date) => {
          const { schedules } = get();
          return schedules.filter((schedule) => {
            const scheduleDate = new Date(schedule.startTime);
            return (
              scheduleDate.getFullYear() === date.getFullYear() &&
              scheduleDate.getMonth() === date.getMonth() &&
              scheduleDate.getDate() === date.getDate()
            );
          });
        },
      }),
      {
        name: 'schedule-storage',
      }
    )
  )
);