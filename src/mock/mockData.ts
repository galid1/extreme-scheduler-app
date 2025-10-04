import {
  Account,
  TrainerResponse,
  MemberResponse,
  AssignmentRequestDto,
  AccountType,
  Gender,
  Platform,
  TrainerScheduleStatus,
  MemberScheduleStatus,
  TrainerStatus,
  RequestStatus
} from '@/src/types/api';
import { Schedule } from '@/src/store/useScheduleStore';
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
  scheduleStatus: TrainerScheduleStatus.READY,
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
  trainerAccountId: 1,
  scheduleStatus: MemberScheduleStatus.SCHEDULED
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

// Mock Schedules
export const mockSchedules: Schedule[] = [
  {
    id: 'schedule-1',
    title: '상체 운동',
    description: '가슴, 어깨, 삼두 운동',
    startTime: new Date(2024, 0, 15, 10, 0),
    endTime: new Date(2024, 0, 15, 11, 30),
    category: '운동',
    color: '#3B82F6',
    isRecurring: true,
    recurringPattern: {
      type: 'weekly',
      interval: 1,
      endDate: new Date(2024, 2, 31)
    },
    reminder: {
      type: 'minutes',
      value: 30
    },
    createdAt: new Date(2024, 0, 1),
    updatedAt: new Date(2024, 0, 1)
  },
  {
    id: 'schedule-2',
    title: '하체 운동',
    description: '스쿼트, 런지, 레그프레스',
    startTime: new Date(2024, 0, 17, 14, 0),
    endTime: new Date(2024, 0, 17, 15, 30),
    category: '운동',
    color: '#10B981',
    isRecurring: true,
    recurringPattern: {
      type: 'weekly',
      interval: 1,
      endDate: new Date(2024, 2, 31)
    },
    reminder: {
      type: 'hours',
      value: 1
    },
    createdAt: new Date(2024, 0, 1),
    updatedAt: new Date(2024, 0, 1)
  },
  {
    id: 'schedule-3',
    title: '유산소 운동',
    description: '러닝머신 30분, 자전거 20분',
    startTime: new Date(2024, 0, 19, 7, 0),
    endTime: new Date(2024, 0, 19, 8, 0),
    category: '운동',
    color: '#F59E0B',
    isRecurring: false,
    reminder: {
      type: 'days',
      value: 1
    },
    createdAt: new Date(2024, 0, 1),
    updatedAt: new Date(2024, 0, 1)
  }
];

// Mock Training Sessions
export const mockTrainingSessions: TrainingSession[] = [
  {
    memberId: 'member-2',
    memberName: '김민수',
    memberPhone: '010-1111-2222',
    hour: 9,
    day: 'MONDAY',
    weekOfYear: 3
  },
  {
    memberId: 'member-3',
    memberName: '이수진',
    memberPhone: '010-3333-4444',
    hour: 10,
    day: 'MONDAY',
    weekOfYear: 3
  },
  {
    memberId: 'member-4',
    memberName: '박정호',
    memberPhone: '010-5555-6666',
    hour: 14,
    day: 'TUESDAY',
    weekOfYear: 3
  },
  {
    memberId: 'member-2',
    memberName: '김민수',
    memberPhone: '010-1111-2222',
    hour: 9,
    day: 'WEDNESDAY',
    weekOfYear: 3
  },
  {
    memberId: 'member-3',
    memberName: '이수진',
    memberPhone: '010-3333-4444',
    hour: 15,
    day: 'THURSDAY',
    weekOfYear: 3
  },
  {
    memberId: 'member-4',
    memberName: '박정호',
    memberPhone: '010-5555-6666',
    hour: 16,
    day: 'FRIDAY',
    weekOfYear: 3
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