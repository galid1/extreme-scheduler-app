import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WeekNavigatorProps {
  currentWeek: number;
  totalWeeks: number;
  onWeekChange: (week: number) => void;
  isCurrentWeek: boolean;
  isPastWeek: boolean;
  isNextWeek: boolean;
}

export default function WeekNavigator({
  currentWeek,
  totalWeeks,
  onWeekChange,
  isCurrentWeek,
  isPastWeek,
  isNextWeek
}: WeekNavigatorProps) {
  // 현재 실제 주차 계산 (연도 기준)
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
  const realCurrentWeek = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);

  // 이전 주차로 갈 수 있는지 확인 (현재 실제 주차보다 이전으로는 갈 수 없음)
  const canGoPrevious = currentWeek > realCurrentWeek;
  // 다음 주차로 갈 수 있는지 확인 (최대 2주 뒤까지만)
  const maxViewableWeek = Math.min(realCurrentWeek + 1, 52);
  const canGoNext = currentWeek < maxViewableWeek;


  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.navButton,
          !canGoPrevious && styles.navButtonDisabled
        ]}
        onPress={() => canGoPrevious && onWeekChange(currentWeek - 1)}
        disabled={!canGoPrevious}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={canGoPrevious ? '#3B82F6' : '#D1D5DB'}
        />
      </TouchableOpacity>

      <View style={styles.weekInfo}>
        <Text style={styles.weekTitle}>
          {currentWeek}주차
        </Text>
        {isCurrentWeek && (
          <View style={styles.currentWeekBadge}>
            <Ionicons name="time" size={12} color="white" />
            <Text style={styles.currentWeekText}>이번 주</Text>
          </View>
        )}
        {isNextWeek && (
          <View style={styles.nextWeekBadge}>
            <Ionicons name="arrow-forward-circle" size={12} color="white" />
            <Text style={styles.nextWeekText}>다음 주</Text>
          </View>
        )}
        {isPastWeek && (
          <View style={styles.pastWeekBadge}>
            <Ionicons name="checkmark-circle" size={12} color="white" />
            <Text style={styles.pastWeekText}>완료</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.navButton,
          !canGoNext && styles.navButtonDisabled
        ]}
        onPress={() => canGoNext && onWeekChange(currentWeek + 1)}
        disabled={!canGoNext}
      >
        <Ionicons
          name="chevron-forward"
          size={24}
          color={canGoNext ? '#3B82F6' : '#D1D5DB'}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  weekInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  currentWeekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  currentWeekText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  nextWeekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  nextWeekText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  pastWeekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pastWeekText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
});
