# Extreme Scheduler App - Project Overview

## Project Type
React Native (Expo) Mobile Application

## Tech Stack
- **Framework**: Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **Language**: TypeScript
- **UI Framework**: React Native 0.81.4
- **State Management**: Zustand (with persist middleware)
- **Styling**: NativeWind (TailwindCSS for React Native)

## Current Directory Structure
```
extreme-scheduler-app/
├── app/                    # Expo Router pages (file-based routing)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home tab
│   │   ├── explore.tsx    # Explore tab
│   │   └── _layout.tsx    # Tab layout configuration
│   ├── _layout.tsx        # Root layout
│   └── modal.tsx          # Modal screen
├── assets/                 # Static assets
│   └── images/            # Image resources
├── components/             # Reusable components
│   ├── ui/                # UI components
│   ├── external-link.tsx
│   ├── haptic-tab.tsx
│   ├── hello-wave.tsx
│   ├── parallax-scroll-view.tsx
│   ├── themed-text.tsx
│   └── themed-view.tsx
├── constants/              # App constants
│   └── theme.ts           # Theme configuration
├── hooks/                  # Custom React hooks
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
└── scripts/                # Build/utility scripts

## Architecture Pattern Analysis
현재 프로젝트는 **Expo Router 기반의 표준 구조**를 따르고 있습니다. 이는 React Native/Expo 커뮤니티에서 권장하는 최신 패턴입니다.

### 현재 패턴의 특징
1. **File-based Routing**: `app/` 디렉토리를 통한 파일 기반 라우팅
2. **Feature Folders**: 기능별 폴더 구조 (components, hooks, constants)
3. **Separation of Concerns**: UI, 로직, 상수의 명확한 분리

## 권장 프로젝트 구조 (확장된 버전)
```
extreme-scheduler-app/
├── app/                    # 라우팅 및 페이지
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (tabs)/            # 탭 네비게이션
│   └── _layout.tsx        # 루트 레이아웃
├── src/
│   ├── components/        # UI 컴포넌트
│   │   ├── common/       # 공통 컴포넌트
│   │   ├── schedule/     # 일정 관련 컴포넌트
│   │   └── ui/          # 기본 UI 컴포넌트
│   ├── features/         # 기능별 모듈
│   │   ├── auth/        # 인증 기능
│   │   ├── schedule/    # 일정 관리
│   │   └── settings/    # 설정
│   ├── services/        # API 및 외부 서비스
│   │   ├── api/        # API 클라이언트
│   │   └── storage/    # 로컬 스토리지
│   ├── hooks/          # 커스텀 훅
│   ├── utils/          # 유틸리티 함수
│   ├── store/          # 전역 상태 관리
│   ├── types/          # TypeScript 타입 정의
│   │   ├── enums.ts   # Enum 정의 (AccountType, ScheduleStatus 등)
│   │   ├── api.ts     # API 타입 정의
│   │   └── user.ts    # User 타입 정의
│   └── constants/      # 상수
├── assets/             # 정적 자산
└── tests/             # 테스트 파일

## 주요 기능 (계획)
- 일정 생성 및 관리
- 알림 설정
- 캘린더 뷰
- 반복 일정
- 카테고리/태그 관리
- 통계 및 분석

## 개발 명령어
```bash
# 개발 서버 실행
npm start

# iOS 실행
npm run ios

# Android 실행
npm run android

# 웹 실행
npm run web

# 린트 체크
npm run lint
```

## 코딩 컨벤션
- TypeScript strict mode 사용
- 함수형 컴포넌트 및 hooks 사용
- 파일명: kebab-case
- 컴포넌트명: PascalCase
- 변수/함수명: camelCase

## Enum 타입 관리 (중요)
Enum 타입들은 `src/types/enums.ts` 파일에서 중앙 관리됩니다:

### 주요 Enum 타입
- **AccountType**: 계정 유형 (MEMBER, TRAINER)
- **MemberScheduleStatus**: 회원 스케줄 상태 (NOT_READY, READY, SCHEDULED)
- **TrainerScheduleStatus**: 트레이너 스케줄 상태 (NOT_READY, READY)
- **Gender**: 성별 (MALE, FEMALE)
- **Platform**: 플랫폼 (IOS, ANDROID)
- **DayOfWeek**: 요일 (MONDAY ~ SUNDAY)
- **RequestStatus**: 요청 상태 (PENDING, ACCEPTED, REJECTED)
- **TrainerStatus**: 트레이너 상태 (PENDING, ACTIVE)
- **TrainingSessionStatus**: 트레이닝 세션 상태 (SCHEDULED, COMPLETED)

### 사용 예시
```typescript
import { AccountType, MemberScheduleStatus } from '@/src/types/enums';

if (accountType === AccountType.MEMBER) {
  // Member logic
}

if (scheduleStatus === MemberScheduleStatus.READY) {
  // Ready status logic
}
```

## 설치된 라이브러리
- **Zustand**: 상태 관리 (persist middleware 포함)
- **NativeWind**: TailwindCSS 스타일링
- **TailwindCSS**: 유틸리티 기반 CSS 프레임워크

## Store 구조
- `src/store/useScheduleStore.ts`: 일정 관리 상태
- `src/store/useSettingsStore.ts`: 앱 설정 상태

## NativeWind 설정 완료
- `tailwind.config.js`: Tailwind 설정
- `global.css`: 전역 스타일
- `metro.config.js`: Metro 번들러 설정
- `nativewind-env.d.ts`: TypeScript 타입 정의

## 디자인 시스템 (필수 준수)
앱의 일관된 UI/UX를 위해 아래 색상 가이드를 **반드시** 따라주세요.

### 색상 팔레트
- **Primary Background**: `white` - 모든 화면의 기본 배경색
- **Primary Button**: `#3B82F6` (파란색) - 활성화된 버튼
- **Disabled Button**: `#E0E0E0` (회색) - 비활성화된 버튼
- **Text on White**: `#1F2937` (진한 회색) - 흰 배경 위의 기본 텍스트
- **Secondary Text**: `#6B7280` (회색) - 보조 텍스트
- **Accent Color**: `#3B82F6` (파란색) - 강조 색상
- **Card Background**: `#F3F4F6` (연한 회색) - 카드/박스 배경
- **Border Color**: `#E5E7EB` (연한 회색) - 테두리 색상

### 적용 원칙
1. **모든 새로운 화면**은 통일된 색상 테마를 사용합니다
2. **배경색**: 기본적으로 `white` 사용
3. **버튼**: 활성화시 `#3B82F6`, 비활성화시 `#E0E0E0`
4. **텍스트**: 흰 배경 위에서는 `#1F2937` (주요 텍스트), `#6B7280` (보조 텍스트) 사용
5. **입력 필드**: 흰 배경, `#E5E7EB` 테두리
6. **강조 요소**: `#3B82F6` (파란색) 사용

특별한 지시가 없는 한, 이 디자인 시스템을 자동으로 적용합니다.

## 페이지 생성 시 주의사항
새로운 페이지를 생성할 때 상단에 (tabs) 관련 내용이나 탭 네비게이션 코드를 추가하지 마세요.
각 페이지는 독립적인 화면으로 구성되어야 합니다.

## API
# Extreme Scheduler API Test Curl Commands

## Base URL
BASE_URL=http://localhost:8080

## Auth APIs

### 1. SMS 인증코드 발송
curl -X POST "${BASE_URL}/api/v1/auths/sms/send" \
-H "Content-Type: application/json" \
-d '{
"phoneNumber": "010-1234-5678",
"deviceId": "test-device-001"
}'

### 2. 로그인 (인증코드 확인)
curl -X POST "${BASE_URL}/api/v1/auths/sign-in" \
-H "Content-Type: application/json" \
-d '{
"phoneNumber": "010-1234-5678",
"identificationCode": "123456"
}'

### 3. 회원가입
curl -X POST "${BASE_URL}/api/v1/auths/sign-up" \
-H "Content-Type: application/json" \
-d '{
"tempTokenForSignUp": "temp-token-xxx",
"name": "홍길동",
"birthDate": "1990-01-01",
"gender": "MALE",
"phoneNumber": "010-1234-5678",
"accountType": "MEMBER",
"profileImageUrl": "https://example.com/profile.jpg",
"pushTokenInfo": {
"token": "fcm-token-string",
"deviceId": "device-001",
"platform": "IOS"
}
}'

## Member APIs (회원 전용 - Authorization 헤더 필요)

### 토큰 변수 설정 (로그인 후 받은 토큰 사용)
MEMBER_TOKEN="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
TRAINER_TOKEN="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

### 4. 트레이너 검색 (회원용)
curl -X GET "${BASE_URL}/api/v1/members/trainer-search?phoneNumber=010-9876-5432" \
-H "Authorization: ${MEMBER_TOKEN}"

### 5. 트레이너 배정 요청 (회원용)
curl -X POST "${BASE_URL}/api/v1/members/trainer-assignment-requests" \
-H "Authorization: ${MEMBER_TOKEN}" \
-H "Content-Type: application/json" \
-d '{
"trainerAccountId": 123
}'

### 6. 내 배정 요청 목록 조회 (회원용)
curl -X GET "${BASE_URL}/api/v1/members/trainer-assignment-requests?page=0&size=10" \
-H "Authorization: ${MEMBER_TOKEN}"

## Member Schedule APIs (회원 스케줄 관리)

### 7. 회원 스케줄 상태를 READY로 변경
curl -X POST "${BASE_URL}/api/v1/members/schedules/ready" \
-H "Authorization: ${MEMBER_TOKEN}"

### 8. 회원 스케줄 상태를 UNREADY로 변경
curl -X POST "${BASE_URL}/api/v1/members/schedules/unready" \
-H "Authorization: ${MEMBER_TOKEN}"

### 9. 회원 스케줄 등록 (정기 + 일회성 통합)
curl -X POST "${BASE_URL}/api/v1/members/schedules/register" \
-H "Authorization: ${MEMBER_TOKEN}" \
-H "Content-Type: application/json" \
-d '{
"periodicScheduleLines": [
{
"dayOfWeek": "MONDAY",
"startHour": 9,
"endHour": 12
},
{
"dayOfWeek": "WEDNESDAY",
"startHour": 14,
"endHour": 16
}
],
"onetimeScheduleLines": [
{
"scheduleDate": "2024-01-15",
"startHour": 10,
"endHour": 11
},
{
"scheduleDate": "2024-01-20",
"startHour": 15,
"endHour": 17
}
]
}'

## Trainer APIs (트레이너 전용)

### 10. 트레이너에게 온 배정 요청 목록 조회
curl -X GET "${BASE_URL}/api/v1/trainers/assignment-requests?status=PENDING" \
-H "Authorization: ${TRAINER_TOKEN}"

### 11. 배정 요청 수락 (트레이너)
curl -X PUT "${BASE_URL}/api/v1/trainers/assignment-requests/456/accept" \
-H "Authorization: ${TRAINER_TOKEN}"

### 12. 배정 요청 거절 (트레이너)
curl -X PUT "${BASE_URL}/api/v1/trainers/assignment-requests/456/reject" \
-H "Authorization: ${TRAINER_TOKEN}" \
-H "Content-Type: application/json" \
-d '{
"rejectReason": "현재 신규 회원을 받지 않습니다"
}'

### 13. 회원을 트레이너에게 직접 배정 (트레이너)
curl -X POST "${BASE_URL}/api/v1/trainers/members" \
-H "Authorization: ${TRAINER_TOKEN}" \
-H "Content-Type: application/json" \
-d '{
"memberAccountId": 789
}'

## Trainer Schedule APIs (트레이너 스케줄 관리)

### 14. 트레이너 스케줄 등록 (정기 + 일회성 통합)
curl -X POST "${BASE_URL}/api/v1/trainers/schedules" \
-H "Authorization: ${TRAINER_TOKEN}" \
-H "Content-Type: application/json" \
-d '{
"periodicScheduleLines": [
{
"dayOfWeek": "MONDAY",
"startHour": 9,
"endHour": 18
},
{
"dayOfWeek": "TUESDAY",
"startHour": 9,
"endHour": 18
}
],
"onetimeScheduleLines": [
{
"scheduleDate": "2024-01-15",
"startHour": 9,
"endHour": 12
}
]
}'

### 15. 트레이너 스케줄 시간 수정 (여러 개 동시 수정)
curl -X PUT "${BASE_URL}/api/v1/trainers/schedules/time" \
-H "Authorization: ${TRAINER_TOKEN}" \
-H "Content-Type: application/json" \
-d '{
"scheduleLines": [
{
"scheduleId": 101,
"startHour": 10,
"endHour": 12
},
{
"scheduleId": 102,
"startHour": 14,
"endHour": 17
}
]
}'

### 16. 자동 스케줄링 실행 (트레이너)
curl -X POST "${BASE_URL}/api/v1/trainers/schedules/auto-scheduling" \
-H "Authorization: ${TRAINER_TOKEN}" \
-H "Content-Type: application/json" \
-d '{
"memberAccountIds": [789, 790, 791],
"targetDate": "2024-01-01",
}'

### 17. 자동 스케줄링 알림 발송 (트레이너)
curl -X POST "${BASE_URL}/api/v1/trainers/auto-scheduling/notification" \
-H "Authorization: ${TRAINER_TOKEN}"
