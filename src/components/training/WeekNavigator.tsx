import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

interface WeekNavigatorProps {
  currentWeek: number;
  totalWeeks: number;
  onWeekChange: (week: number) => void;
  isCurrentWeek: boolean;
  isPastWeek: boolean;
  isNextWeek: boolean;
  onBack: () => void;
  showEditButton?: boolean;
  isEditMode?: boolean;
  onEditPress?: () => void;
  onSavePress?: () => void;
  onCancelPress?: () => void;
  isSaving?: boolean;
}

export default function WeekNavigator({
  currentWeek,
  totalWeeks,
  onWeekChange,
  isCurrentWeek,
  isPastWeek,
  isNextWeek,
  onBack,
  showEditButton = false,
  isEditMode = false,
  onEditPress,
  onSavePress,
  onCancelPress,
  isSaving = false,
}: WeekNavigatorProps) {
  // 현재 실제 주차 계산 (연도 기준)
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
  const realCurrentWeek = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);

  // 주차 기간 문자열 생성
  const getWeekPeriod = () => {
    const year = today.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const daysOffset = (currentWeek - 1) * 7;
    const weekStart = new Date(jan1.getTime() + daysOffset * 24 * 60 * 60 * 1000);

    // 월요일로 조정
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    // 일요일 계산
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startMonth = weekStart.getMonth() + 1;
    const startDate = weekStart.getDate();
    const endMonth = weekEnd.getMonth() + 1;
    const endDate = weekEnd.getDate();

    if (startMonth === endMonth) {
      return `${startMonth}월 ${startDate}일 - ${endDate}일`;
    } else {
      return `${startMonth}월 ${startDate}일 - ${endMonth}월 ${endDate}일`;
    }
  };

  // 이전 주차로 갈 수 있는지 확인 (현재 실제 주차보다 이전으로는 갈 수 없음)
  const canGoPrevious = currentWeek > realCurrentWeek;
  // 다음 주차로 갈 수 있는지 확인 (최대 2주 뒤까지만)
  const maxViewableWeek = Math.min(realCurrentWeek + 1, 52);
  const canGoNext = currentWeek < maxViewableWeek;


  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={isEditMode ? onCancelPress : onBack}
      >
        {isEditMode ? (
          <Text style={styles.cancelText}>취소</Text>
        ) : (
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        )}
      </TouchableOpacity>

      <View style={styles.weekInfo}>
        <View style={styles.weekTitleRow}>
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
        <Text style={styles.weekPeriod}>{getWeekPeriod()}</Text>
      </View>

      {showEditButton && (
        <TouchableOpacity
          style={[
            styles.editButton,
            isEditMode && styles.editButtonSaveMode,
            isSaving && styles.editButtonDisabled
          ]}
          onPress={isEditMode ? onSavePress : onEditPress}
          disabled={isSaving}
        >
          <Text style={[
            styles.editButtonText,
            isEditMode && styles.editButtonSaveText
          ]}>
            {isEditMode ? '저장' : '수정'}
          </Text>
        </TouchableOpacity>
      )}
      {!showEditButton && <View style={{width: 44}} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weekTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  weekPeriod: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  currentWeekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
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
    backgroundColor: '#F59E0B',
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
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  editButtonSaveMode: {
    backgroundColor: '#3B82F6',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  editButtonSaveText: {
    color: 'white',
  },
  editButtonDisabled: {
    opacity: 0.5,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
