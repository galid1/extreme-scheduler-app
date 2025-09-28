/**
 * API Type Definitions
 */

// Common Types
export type AccountType = 'MEMBER' | 'TRAINER';
export type Gender = 'MALE' | 'FEMALE';
export type Platform = 'IOS' | 'ANDROID';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

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
  rejectReason?: string;
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

// Schedule Response Types
export interface GetFreeTimeScheduleResponse {
  periodicScheduleList: Schedule[];
  onetimeScheduleList: Schedule[];
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

// Current Account Types
export interface PrivacyInfo {
  name: string;
  birthDate: string;
  gender: Gender;
  phoneNumber: string;
}

export interface PushTokenInfo {
  token: string;
  deviceId: string;
  platform: Platform;
  lastUpdatedAt: string;
}

export interface Account {
  id: number;
  accountType: AccountType;
  profileImageUrl?: string;
  privacyInfo: PrivacyInfo;
  pushToken?: PushTokenInfo;
}

export type TrainerScheduleStatus = 'NOT_READY' | 'READY';
export type TrainerStatus = 'PENDING' | 'ACTIVE';
export type MemberScheduleStatus = 'NOT_READY' | 'READY' | 'SCHEDULED';

export interface CurrentTrainerResponse {
  accountId: number;
  scheduleStatus: TrainerScheduleStatus;
  status: TrainerStatus;
  memberAccountIdList: number[];
}

export interface CurrentMemberResponse {
  accountId: number;
  trainerAccountId?: number;
  scheduleStatus: MemberScheduleStatus;
}

export interface CurrentAccountRequest {
  authToken: string;
}

export interface CurrentAccountResponse {
  account: Account;
  member?: CurrentMemberResponse;
  trainer?: CurrentTrainerResponse;
}
