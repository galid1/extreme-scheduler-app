/**
 * API Type Definitions
 */

import {
    AccountType,
    Gender,
    Platform,
    DayOfWeek,
    RequestStatus,
    TrainerStatus,
    AutoSchedulingResultStatus
} from './enums';

// Re-export enums for backward compatibility
export {
    AccountType,
    Gender,
    Platform,
    DayOfWeek,
    RequestStatus,
    TrainerStatus,
    AutoSchedulingResultStatus
};

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
    authToken?: string;  // Present when user exists and login is successful
    tempTokenForSignUp?: string;  // Present when user doesn't exist (needs signup)
}

export interface SignUpRequest {
    tempTokenForSignUp: string;
    name: string;
    birthDate: string;
    gender: Gender;
    phoneNumber: string;
    accountType: AccountType;
    profileImageUrl?: string;
    pushToken?: string;
}

export interface SignUpResponse {
    authToken: string;
    accountId: number;
    accountType: AccountType;
}

export interface TrainerSearchResponse {
    exists: boolean;
    trainerAccountId?: number;
    name?: string;
    phoneNumber?: string;
    profileImageUrl?: string;
}

export interface AssignedTrainerResponse {
    trainerAccountId: number;
    name: string;
    phoneNumber: string;
    profileImageUrl?: string;
    assignedTrainerFixedSchedule: boolean;
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

// Member의 트레이너 배정 요청 타입
export interface MemberTrainerAssignmentRequestDto {
    requestId: number;
    trainerAccountId: number;
    trainerName: string;
    status: RequestStatus;
    requestedAt: string;
    processedAt?: string;
    rejectReason?: string;
}

// 트레이너 배정 요청 취소 응답
export interface CancelTrainerAssignmentApiResponse {
    requestId: number;
    memberAccountId: number;
    trainerAccountId: number;
    cancelledAt: string;
}

// Schedule Types
export interface PeriodicScheduleLine {
    id?: number | null;
    dayOfWeek: DayOfWeek;
    startHour: number;
    endHour: number;
}

export interface OnetimeScheduleLine {
    id?: number | null;
    scheduleDate: string;
    startHour: number;
    endHour: number;
}

export interface RegisterScheduleRequest {
    targetYear: number;
    targetWeekOfYear: number;
    periodicScheduleLines?: PeriodicScheduleLine[];
    onetimeScheduleLines?: OnetimeScheduleLine[];
}

export interface UnRegisterMemberFreeTimeScheduleRequest {
    targetYear: number;
    targetWeekOfYear: number;
}

export interface RegisterMemberFreeTimeScheduleResponse {
    success: boolean;
    message?: string;
}

export interface AutoSchedulingRequest {
    memberSessionCounts: Record<number, number>;
    targetYear: number;
    targetWeekOfYear: number;
}

export interface AutoSchedulingResponse {
    totalMatchings: number;
    successfulMemberIds: number[];
    failedMemberIds: number[];
}

// Schedule Response Types
export interface GetFreeTimeScheduleResponse {
    periodicScheduleLines: PeriodicScheduleLine[];
    onetimeScheduleLines: OnetimeScheduleLine[];
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

// Assigned Member Types
export interface AssignedMemberDto {
    accountId: number;
    name: string;
    phoneNumber: string;
}

export interface GetAssignedMembersResponse {
    members: AssignedMemberDto[];
}

// Member with Schedules Types
export interface MemberWithSchedulesResponse {
    accountId: number;
    name: string;
    birthDate: string;
    gender: Gender;
    phoneNumber: string;
    lastAttendanceDateTime?: string;
    weeklyFreeTimeScheduleRegistrationStatus: boolean;
    periodicSchedules: PeriodicScheduleLine[];
    onetimeSchedules: OnetimeScheduleLine[];
}

export interface GetAssignedMembersWithSchedulesResponse {
    members: MemberWithSchedulesResponse[];
    year: number;
    weekOfYear: number;
}

// Current Account Types
export interface PrivacyInfo {
    name: string;
    birthDate: string;
    gender: Gender;
    phoneNumber: string;
}

export interface Account {
    id: number;
    accountType: AccountType;
    profileImageUrl?: string;
    privacyInfo: PrivacyInfo;
}


export interface TrainerResponse {
    accountId: number;
    status: TrainerStatus;
    memberAccountIdList: number[];
}

export interface MemberResponse {
    accountId: number;
    trainerAccountId?: number;
}

export interface CurrentAccountRequest {
    authToken: string;
}

export interface CurrentAccountResponse {
    account: Account;
    member?: MemberResponse;
    trainer?: TrainerResponse;
}

export interface GetFixedAutoSchedulingResultResponse {
    data: AutoSchedulingScheduleApiResponse[];
}

// Weekly Schedule Registration Status Types
export interface WeeklyScheduleRegistrationStatusResponse {
    registered: boolean;
    year: number;
    weekOfYear: number;
}

// 트레이너의 자동 스케줄링 완료 여부 확인
export interface TrainerAutoSchedulingStatusResponse {
    weeklyAutoSchedulingResultStatus: AutoSchedulingResultStatus;
    targetYear: number;
    targetWeekOfYear: number;
}

export interface TrainerWeeklyScheduleRegistrationStatusResponse {
    registered: boolean;
    year: number;
    weekOfYear: number;
}

// Auto Scheduling Result Types
export interface AutoSchedulingScheduleApiResponse {
    autoSchedulingResultId?: number; // Individual schedule item ID for cancellation
    memberName: string;
    memberAccountId: number;
    year: number;
    weekOfYear: number;
    dayOfWeek: DayOfWeek;
    startHour: number;
    endHour: number;
}

export interface GetAutoSchedulingResultApiResponse {
    autoSchedulingResultLineId: number;
    weeklyAutoSchedulingResultStatus?: AutoSchedulingResultStatus;
    year: number;
    weekOfYear: number;
    scheduleList: AutoSchedulingScheduleApiResponse[];
}

export interface CancelAutoSchedulingResultApiResponse {
    success: boolean;
}

export interface ScheduleModificationAvailabilityResponse {
    canModify: boolean;
    message?: string;
}

export interface CancelAutoSchedulingApiResponse {
    success: boolean;
    message?: string;
}

export interface CancelRequestResponse {
    requestId: number;
    autoSchedulingResultId: number;
    year: number;
    weekOfYear: number;
    dayOfWeek: DayOfWeek;
    startHour: number;
    endHour: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectedReason?: string;
    createdAt: string;
    processedAt?: string;
}

export interface GetCancelRequestsResponse {
    data: CancelRequestResponse[];
}

// Trainer Cancel Request Types
export interface CancelRequestDetailResponse {
    requestId: number;
    autoSchedulingResultId: number;
    memberAccountId: number;
    memberName: string;
    year: number;
    weekOfYear: number;
    dayOfWeek: DayOfWeek;
    startHour: number;
    endHour: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectedReason?: string;
    createdAt: string;
    processedAt?: string;
}

export interface GetCancelRequestsApiResponse {
    cancelRequests: CancelRequestDetailResponse[];
}

export interface ProcessCancelRequestApiRequest {
    action: 'APPROVE' | 'REJECT';
    rejectedReason?: string;
}

export interface ProcessCancelRequestApiResponse {
    success: boolean;
    status: 'APPROVED' | 'REJECTED';
    processedAt: string;
}

// Auto Scheduling Result Lines Update Types
export interface UpdateAutoSchedulingResultLineDto {
    autoSchedulingResultLineId: number;
    toDayOfWeek: DayOfWeek;
    toStartHour: number;
    toEndHour: number;
}

export interface UpdateAutoSchedulingResultLinesApiRequest {
    updates: UpdateAutoSchedulingResultLineDto[];
}

export interface UpdateAutoSchedulingResultLinesApiResponse {
    updatedCount: number;
}

// Trainer Notice Types
export interface TrainerNoticeResponse {
    noticeId: number;
    trainerAccountId: number;
    title: string;
    content: string;
    fixed: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTrainerNoticeApiRequest {
    title: string;
    content: string;
    fixed: boolean;
}

export interface UpdateTrainerNoticeApiRequest {
    title: string;
    content: string;
}

export interface TrainerNoticeListResponse {
    notices: TrainerNoticeResponse[];
    totalElements: number;
    currentPage: number;
    pageSize: number;
}

export interface MemberTrainerNoticeListResponse {
    trainerAccountId: number;
    notices: TrainerNoticeResponse[];
    totalElements: number;
    currentPage: number;
    pageSize: number;
}

// Notification Types
export enum NotificationType {
    TRAINER_ASSIGNMENT_REQUEST = "TRAINER_ASSIGNMENT_REQUEST",    // 트레이너 배정 요청
    TRAINER_ASSIGNMENT_ACCEPTED = "TRAINER_ASSIGNMENT_ACCEPTED",   // 트레이너 배정 수락
    TRAINER_ASSIGNMENT_REJECTED = "TRAINER_ASSIGNMENT_REJECTED",   // 트레이너 배정 거절

    // 스케줄 관련
    SCHEDULE_CHANGED = "SCHEDULE_CHANGED",              // 스케줄 변경
    AUTO_SCHEDULE_FIXED = "AUTO_SCHEDULE_FIXED",          // 자동 스케줄링 확정
    AUTO_SCHEDULE_CANCELLED = "AUTO_SCHEDULE_CANCELLED",        // 자동 스케줄링 삭제
    CANCEL_REQUEST_APPROVED = "CANCEL_REQUEST_APPROVED",      // 취소 요청 승인
    CANCEL_REQUEST_REJECTED = "CANCEL_REQUEST_REJECTED",      // 취소 요청 거절
}

export interface UnreadNotificationDto {
    notificationId: number;
    notificationRequestId: number;
    senderAccountId: number;
    title: string;
    message: string;
    notificationType: NotificationType;
    createdAt: string;
    isRead: false; // Always false for unread notifications
}

export interface ReadNotificationDto {
    notificationId: number;
    notificationRequestId: number;
    senderAccountId: number;
    title: string;
    message: string;
    notificationType: NotificationType;
    createdAt: string;
    readAt: string;
    isRead: true; // Always true for read notifications
}

// Union type for both read and unread notifications
export type NotificationDto = UnreadNotificationDto | ReadNotificationDto;

export interface UnreadNotificationCountResponse {
    unreadCount: number;
    hasUnread: boolean;
}

export interface UnreadNotificationListResponse {
    notifications: NotificationDto[];
    hasNext: boolean;
    lastNotificationId: number | null;
}

export interface ReadNotificationListResponse {
    notifications: NotificationDto[];
    hasNext: boolean;
    lastNotificationId: number | null;
}

export interface ReadNotificationResponse {
    notificationId: number;
    success: boolean;
}

