import {
  Account,
  TrainerResponse,
  MemberResponse,
  AssignmentRequestDto,
  AccountType,
  Gender,
  Platform,
  TrainerStatus,
  RequestStatus
} from '@/src/types/api';
import { TrainingSession } from '@/src/store/useTrainingStore';

// Mock Auth Data
export const mockAccount: Account = {
  id: 1,
  accountType: AccountType.TRAINER,
  profileImageUrl: 'https://via.placeholder.com/150',
  privacyInfo: {
    name: '김트레이너',
    birthDate: '1990-01-01',
    gender: Gender.MALE,
    phoneNumber: '010-1234-5678'
  },
  pushToken: {
    token: 'mock-fcm-token',
    deviceId: 'mock-device-001',
    platform: Platform.IOS,
    lastUpdatedAt: new Date().toISOString()
  }
};

export const mockTrainer: TrainerResponse = {
  accountId: 1,
  status: TrainerStatus.ACTIVE,
  memberAccountIdList: [2, 3, 4]
};

export const mockMemberAccount: Account = {
  id: 2,
  accountType: AccountType.MEMBER,
  profileImageUrl: 'https://via.placeholder.com/150',
  privacyInfo: {
    name: '이회원',
    birthDate: '1995-05-15',
    gender: Gender.FEMALE,
    phoneNumber: '010-9876-5432'
  }
};

export const mockMember: MemberResponse = {
  accountId: 2,
  trainerAccountId: 1
};

// Mock Assignment Requests
export const mockAssignmentRequests: AssignmentRequestDto[] = [
  {
    requestId: 1,
    memberAccountId: 5,
    memberName: '박민수',
    memberPhone: '010-1111-2222',
    status: RequestStatus.PENDING,
    requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    requestId: 2,
    memberAccountId: 6,
    memberName: '정수진',
    memberPhone: '010-3333-4444',
    status: RequestStatus.PENDING,
    requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    requestId: 3,
    memberAccountId: 7,
    memberName: '최영호',
    memberPhone: '010-5555-6666',
    status: RequestStatus.ACCEPTED,
    requestedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    requestId: 4,
    memberAccountId: 8,
    memberName: '김지은',
    memberPhone: '010-7777-8888',
    status: RequestStatus.REJECTED,
    requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    rejectReason: '현재 신규 회원을 받지 않습니다'
  }
];

// Mock Settings
export const mockSettings = {
  theme: 'light' as const,
  language: 'ko' as const,
  notificationsEnabled: true,
  defaultReminderMinutes: 30,
  weekStartsOn: 1 as const
};

// Mock Schedule for Auth Store
export const mockSavedSchedule = {
  MONDAY: [
    { hour: 9, state: 'recurring' as const },
    { hour: 10, state: 'recurring' as const },
    { hour: 14, state: 'none' as const },
    { hour: 15, state: 'none' as const }
  ],
  TUESDAY: [
    { hour: 14, state: 'recurring' as const },
    { hour: 15, state: 'recurring' as const }
  ],
  WEDNESDAY: [
    { hour: 9, state: 'recurring' as const },
    { hour: 10, state: 'none' as const }
  ],
  THURSDAY: [
    { hour: 15, state: 'recurring' as const },
    { hour: 16, state: 'recurring' as const }
  ],
  FRIDAY: [
    { hour: 16, state: 'recurring' as const },
    { hour: 17, state: 'none' as const }
  ]
};
