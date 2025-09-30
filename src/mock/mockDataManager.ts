import { useAuthStore } from '@/src/store/useAuthStore';
import { useAssignmentStore } from '@/src/store/useAssignmentStore';
import { useScheduleStore } from '@/src/store/useScheduleStore';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { useTrainingStore } from '@/src/store/useTrainingStore';
import {
  mockAccount,
  mockTrainer,
  mockMember,
  mockMemberAccount,
  mockSavedSchedule,
  mockAssignmentRequests,
  mockSchedules,
  mockTrainingSessions,
  mockSettings
} from './mockData';
import {AccountType, WeekScheduleStatus} from '@/src/types/enums';

export class MockDataManager {
  /**
   * Initialize all stores with mock data based on the selected role
   */
  static async initializeAllStores(role: 'trainer' | 'member' = 'trainer') {
    const isTrainer = role === 'trainer';

    // Auth Store
    const authStore = useAuthStore.getState();
    if (isTrainer) {
      authStore.setToken('mock-trainer-token');
      authStore.setAccountData({
        account: mockAccount,
        trainer: mockTrainer,
        member: undefined,
      });
    } else {
      authStore.setToken('mock-member-token');
      authStore.setAccountData({
        account: mockMemberAccount,
        trainer: undefined,
        member: mockMember,
      });
    }
    authStore.setSavedSchedule(mockSavedSchedule);

    // Assignment Store - Load mock assignment requests
    const assignmentStore = useAssignmentStore.getState();
    assignmentStore.setAssignmentRequests(mockAssignmentRequests);

    // Schedule Store - Load mock schedules
    const scheduleStore = useScheduleStore.getState();
    scheduleStore.setSchedules(mockSchedules);

    // Training Store - Load mock training sessions
    const trainingStore = useTrainingStore.getState();
    trainingStore.setTrainingSessions(mockTrainingSessions);
    trainingStore.setCurrentWeek(3);
    trainingStore.setTotalWeeks(12);

    // Settings Store - Load mock settings
    const settingsStore = useSettingsStore.getState();
    settingsStore.setTheme(mockSettings.theme);
    settingsStore.setLanguage(mockSettings.language);
    if (mockSettings.notificationsEnabled !== settingsStore.notificationsEnabled) {
      settingsStore.toggleNotifications();
    }
    settingsStore.setDefaultReminder(mockSettings.defaultReminderMinutes);
    settingsStore.setWeekStartsOn(mockSettings.weekStartsOn);

    return {
      accountType: isTrainer ? AccountType.TRAINER : AccountType.MEMBER,
      name: isTrainer ? mockAccount.privacyInfo.name : mockMemberAccount.privacyInfo.name
    };
  }

  /**
   * Clear all mock data from stores
   */
  static clearAllStores() {
    // Auth Store
    const authStore = useAuthStore.getState();
    authStore.logout();

    // Assignment Store
    const assignmentStore = useAssignmentStore.getState();
    assignmentStore.clearAssignmentRequests();

    // Schedule Store
    const scheduleStore = useScheduleStore.getState();
    scheduleStore.setSchedules([]);

    // Training Store
    const trainingStore = useTrainingStore.getState();
    trainingStore.resetTraining();

    // Settings Store - Reset to defaults
    const settingsStore = useSettingsStore.getState();
    settingsStore.setTheme('system');
    settingsStore.setLanguage('ko');
    if (!settingsStore.notificationsEnabled) {
      settingsStore.toggleNotifications();
    }
    settingsStore.setDefaultReminder(15);
    settingsStore.setWeekStartsOn(1);
  }

  /**
   * Switch between trainer and member role while maintaining mock mode
   */
  static async switchRole(newRole: 'trainer' | 'member') {
    // Clear current data
    this.clearAllStores();

    // Initialize with new role
    return this.initializeAllStores(newRole);
  }

  /**
   * Check if mock data is currently loaded
   */
  static isMockDataLoaded(): boolean {
    const authStore = useAuthStore.getState();
    return authStore.token?.includes('mock-') ?? false;
  }

  /**
   * Get current mock role
   */
  static getCurrentMockRole(): 'trainer' | 'member' | null {
    const authStore = useAuthStore.getState();
    if (!this.isMockDataLoaded()) return null;

    return authStore.account?.accountType === AccountType.TRAINER ? 'trainer' : 'member';
  }
}
