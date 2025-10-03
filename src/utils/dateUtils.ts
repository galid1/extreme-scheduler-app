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
