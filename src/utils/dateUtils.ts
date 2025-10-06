/**
 * Date Utility Functions
 * 날짜 관련 유틸리티 함수들
 */

/**
 * 특정 날짜가 속한 주의 월요일을 구함
 * @param date 기준 날짜
 * @returns 해당 주의 월요일
 */
const getMondayOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 일요일(0)이면 -6, 그 외는 1-day
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * 특정 날짜의 연도와 주차를 계산
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

export const getCurrentWeekDateRange = (date: Date = new Date()): { startDate: Date; endDate: Date } => {
    const currentWeekDate = new Date(date);
    const startDate = getMondayOfWeek(currentWeekDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return { startDate, endDate };
};

/**
 * 다음 주의 시작일(월요일)과 종료일(일요일)을 계산
 * @param date 기준 날짜 (기본값: 현재 날짜)
 * @returns { startDate: Date, endDate: Date }
 */
export const getNextWeekDateRange = (date: Date = new Date()): { startDate: Date; endDate: Date } => {
  const nextWeekDate = new Date(date);
  nextWeekDate.setDate(date.getDate() + 7);

  const startDate = getMondayOfWeek(nextWeekDate);
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
