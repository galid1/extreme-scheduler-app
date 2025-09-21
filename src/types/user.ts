export type AccountType = 'MEMBER' | 'TRAINER';

export type ScheduleStatus = 'NOT_READY' | 'READY' | 'SCHEDULED';

export interface User {
  name: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  phoneNumber: string;
  accountType: AccountType;
  // Member specific fields
  trainerAccountId?: string | null;
  scheduleStatus?: ScheduleStatus;
}