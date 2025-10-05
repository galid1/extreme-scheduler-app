import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { getNextWeekYearAndWeek, getNextWeekDateRange, formatDateMMDD } from '@/src/utils/dateUtils';

interface WeekInfoProps {
  style?: any;
}

export default function WeekInfo({ style }: WeekInfoProps) {
  const { targetWeekOfYear } = getNextWeekYearAndWeek();
  const { startDate, endDate } = getNextWeekDateRange();
  const weekInfo = `${targetWeekOfYear}주차 (${formatDateMMDD(startDate)} ~ ${formatDateMMDD(endDate)})`;

  return <Text style={[styles.weekInfoText, style]}>{weekInfo}</Text>;
}

const styles = StyleSheet.create({
  weekInfoText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
