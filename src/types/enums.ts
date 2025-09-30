export enum AccountType {
  MEMBER = 'MEMBER',
  TRAINER = 'TRAINER'
}

export enum MemberScheduleStatus {
  NOT_READY = 'NOT_READY',
  READY = 'READY',
  SCHEDULED = 'SCHEDULED'
}

export enum TrainerScheduleStatus {
  NOT_READY = 'NOT_READY',
  READY = 'READY',
  SCHEEULDED = 'SCHEDULED',
}

// 자동 스케줄링 결과 상태
export enum WeekScheduleStatus {
    NOT_FIXED,
    FIXED,
    CANCELLED,
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}

export enum Platform {
  IOS = 'IOS',
  ANDROID = 'ANDROID'
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export enum TrainerStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE'
}

export enum TrainingSessionStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}
