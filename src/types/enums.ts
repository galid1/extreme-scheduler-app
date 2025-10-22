export enum AccountType {
  MEMBER = 'MEMBER',
  TRAINER = 'TRAINER'
}

// 자동 스케줄링 결과 상태
export enum AutoSchedulingResultStatus {
    PLACEHOLDER = 'PLACEHOLDER',
    SCHEDULED = 'SCHEDULED',
    FIXED = 'FIXED',
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

export enum CalendarPlatformType {
    GOOGLE_CALENDAR = "GOOGLE_CALENDAR",
    NAVER_CALENDAR = "NAVER_CALENDAR",
}
