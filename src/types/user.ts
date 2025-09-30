import { AccountType, Gender, MemberScheduleStatus } from './enums';

export interface User {
  name: string;
  birthDate: string;
  gender: Gender;
  phoneNumber: string;
  accountType: AccountType;
  // Member specific fields
  trainerAccountId?: string | null;
  scheduleStatus?: MemberScheduleStatus;
}