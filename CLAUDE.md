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
