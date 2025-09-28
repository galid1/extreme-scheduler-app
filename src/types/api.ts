/**
 * API Type Definitions
 */

// Common Types
export type AccountType = 'MEMBER' | 'TRAINER';
export type Gender = 'MALE' | 'FEMALE';
export type Platform = 'IOS' | 'ANDROID';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type ScheduleStatus = 'READY' | 'UNREADY';

// Auth Types
export interface SendSmsRequest {
  phoneNumber: string;
  deviceId: string;
}

export interface SignInRequest {
  phoneNumber: string;
  identificationCode: string;
}

export interface SignInResponse {
  accessToken: string;
  refreshToken: string;
  accountType: AccountType;
  accountId: number;
  name: string;
}

export interface PushTokenInfo {
  token: string;
  deviceId: string;
  platform: Platform;
}

export interface SignUpRequest {
  tempTokenForSignUp: string;
  name: string;
  birthDate: string;
  gender: Gender;
  phoneNumber: string;
  accountType: AccountType;
  profileImageUrl?: string;
  pushTokenInfo?: PushTokenInfo;
}

export interface SignUpResponse {
  accessToken: string;
  refreshToken: string;
  accountId: number;
  accountType: AccountType;
  name: string;
}

export interface TrainerSearchResponse {
    trainerAccountId: number;
    name: string;
    phoneNumber: string;
    profileImageUrl?: string;
}

// Assignment Request Types
export interface AssignmentRequestDto {
  requestId: number;
  memberAccountId: number;
  memberName: string | null;
  memberPhone: string | null;
  status: RequestStatus;
  requestedAt: string;
}

export interface TrainerAssignmentRequestListResponse {
  content: AssignmentRequestDto[];
}

export interface CreateAssignmentRequest {
  trainerAccountId: number;
}

export interface RejectAssignmentRequest {
  rejectReason: string;
}

// Schedule Types
export interface PeriodicScheduleLine {
  dayOfWeek: DayOfWeek;
  startHour: number;
  endHour: number;
}

export interface OnetimeScheduleLine {
  scheduleDate: string;
  startHour: number;
  endHour: number;
}

export interface RegisterScheduleRequest {
  periodicScheduleLines?: PeriodicScheduleLine[];
  onetimeScheduleLines?: OnetimeScheduleLine[];
}

export interface ScheduleTimeUpdate {
  scheduleId: number;
  startHour: number;
  endHour: number;
}

export interface UpdateScheduleTimeRequest {
  scheduleLines: ScheduleTimeUpdate[];
}

export interface AutoSchedulingRequest {
  memberAccountIds: number[];
  startDate: string;
  endDate: string;
}

export interface Schedule {
  scheduleId: number;
  accountId: number;
  scheduleDate?: string;
  dayOfWeek?: DayOfWeek;
  startHour: number;
  endHour: number;
  isPeriodic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Training Session Types
export interface TrainingSession {
  sessionId: number;
  trainerId: number;
  memberId: number;
  scheduleDate: string;
  startHour: number;
  endHour: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Page Response
export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// Add Member to Trainer Request
export interface AddMemberToTrainerRequest {
  memberAccountId: number;
}

// API Error Response
export interface ApiError {
  code: string;
  message: string;
  timestamp: string;
  path?: string;
  details?: Record<string, any>;
}

// Current Account Types
export interface Account {
  accountId: number;
  name: string;
  phoneNumber: string;
  accountType: AccountType;
  birthDate: string;
  gender: Gender;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trainer {
  trainerId: number;
  accountId: number;
}

export interface Member {
  memberId: number;
  accountId: number;
}

export interface CurrentAccountRequest {
  authToken: string;
}

export interface CurrentAccountResponse {
  account: Account;
  trainer?: Trainer;
  member?: Member;
}
