import { AccountType, Gender } from './enums';

export interface User {
  name: string;
  birthDate: string;
  gender: Gender;
  phoneNumber: string;
  accountType: AccountType;
  // Member specific fields
  trainerAccountId?: string | null;
}