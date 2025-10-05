/**
 * Date Utility Functions
 * 날짜 관련 유틸리티 함수들
 */

/**
 * 특정 날짜의 연도와 주차를 계산 (ISO 8601 방식)
 * @param date 계산할 날짜 (기본값: 현재 날짜)
 * @returns { targetYear: number, targetWeekOfYear: number }
 */
export const getYearAndWeek = (date: Date = new Date()): { targetYear: number; targetWeekOfYear: number } => {
  const targetYear = date.getFullYear();
  const startOfYear = new Date(targetYear, 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const targetWeekOfYear = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);

  return {
    targetYear,
    targetWeekOfYear
  };
};

/**
 * 다음 주의 연도와 주차를 계산
 * @param date 기준 날짜 (기본값: 현재 날짜)
 * @returns { targetYear: number, targetWeekOfYear: number }
 */
export const getNextWeekYearAndWeek = (date: Date = new Date()): { targetYear: number; targetWeekOfYear: number } => {
  const nextWeekDate = new Date(date);
  nextWeekDate.setDate(date.getDate() + 7);
  return getYearAndWeek(nextWeekDate);
};

/**
 * 특정 주차의 시작일(월요일)과 종료일(일요일)을 계산
 * @param year 연도
 * @param weekOfYear 주차
 * @returns { startDate: Date, endDate: Date }
 */
export const getWeekDateRange = (year: number, weekOfYear: number): { startDate: Date; endDate: Date } => {
  const startOfYear = new Date(year, 0, 1);
  const daysToFirstMonday = (8 - startOfYear.getDay()) % 7;
  const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);

  const startDate = new Date(firstMonday);
  startDate.setDate(firstMonday.getDate() + (weekOfYear - 1) * 7);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return { startDate, endDate };
};

/**
 * 날짜를 "MM/DD" 형식으로 포맷
 * @param date 포맷할 날짜
 * @returns "MM/DD" 형식의 문자열
 */
export const formatDateMMDD = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}/${day}`;
};
