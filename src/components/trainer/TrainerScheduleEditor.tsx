import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { DayOfWeek, RegisterScheduleRequest } from '@/src/types/api';
import { trainerScheduleService } from '@/src/services/api';
import authService from '@/src/services/api/auth.service';

type TimeSlotState = 'none' | 'once' | 'recurring';

interface TimeSlotSelection {
  hour: number;
  state: TimeSlotState;
}

interface TrainerScheduleEditorProps {
  showScheduleEdit: boolean;
  savedSchedule: { [key: string]: TimeSlotSelection[] } | null;
  selectedTimes: { [key: string]: TimeSlotSelection[] };
  setSelectedTimes: (times: { [key: string]: TimeSlotSelection[] }) => void;
  expandedDay: string | null;
  setExpandedDay: (day: string | null) => void;
  isSubmittingSchedule: boolean;
  setIsSubmittingSchedule: (value: boolean) => void;
  mockMode: boolean;
  onCancel: () => void;
  onSuccess: (times: { [key: string]: TimeSlotSelection[] }) => void;
  setAccountData: (data: any) => void;
  fromDetail?: boolean;
  onBackToDetail?: () => void;
}

export default function TrainerScheduleEditor({
  showScheduleEdit,
  savedSchedule,
  selectedTimes,
  setSelectedTimes,
  expandedDay,
  setExpandedDay,
  isSubmittingSchedule,
  setIsSubmittingSchedule,
  mockMode,
  onCancel,
  onSuccess,
  setAccountData,
  fromDetail = false,
  onBackToDetail,
}: TrainerScheduleEditorProps) {
  const handleTimeSlotPress = (day: string, hour: number) => {
    const dayTimes = selectedTimes[day] || [];
    const existingIndex = dayTimes.findIndex((t) => t.hour === hour);

    if (existingIndex >= 0) {
      const currentState = dayTimes[existingIndex].state;
      if (currentState === 'recurring') {
        // Change to once
        const updated = [...dayTimes];
        updated[existingIndex] = { hour, state: 'once' };
        setSelectedTimes({ ...selectedTimes, [day]: updated });
      } else {
        // Remove (once -> none)
        setSelectedTimes({
          ...selectedTimes,
          [day]: dayTimes.filter((t) => t.hour !== hour),
        });
      }
    } else {
      // Add as recurring
      setSelectedTimes({
        ...selectedTimes,
        [day]: [...dayTimes, { hour, state: 'recurring' }].sort((a, b) => a.hour - b.hour),
      });
    }
  };

  const handleSubmit = async () => {
    if (!Object.keys(selectedTimes).some((day) => selectedTimes[day]?.length > 0)) {
      return;
    }

    // If a day is expanded, collapse it first
    if (expandedDay) {
      setExpandedDay(null);
      return;
    }

    // Convert day names to DayOfWeek enum
    const dayMapping: { [key: string]: DayOfWeek } = {
      '월': 'MONDAY',
      '화': 'TUESDAY',
      '수': 'WEDNESDAY',
      '목': 'THURSDAY',
      '금': 'FRIDAY',
      '토': 'SATURDAY',
      '일': 'SUNDAY',
    };

    try {
      setIsSubmittingSchedule(true);

      // Prepare schedule data for API
      const request: RegisterScheduleRequest = {
        periodicScheduleLines: [],
        onetimeScheduleLines: [],
      };

      // Get current date for one-time schedules
      const today = new Date();
      const getNextDate = (dayOfWeek: string) => {
        const targetDay = ['일', '월', '화', '수', '목', '금', '토'].indexOf(dayOfWeek);
        const currentDay = today.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7; // If same day, schedule for next week
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + daysUntilTarget);
        return nextDate.toISOString().split('T')[0];
      };

      // Process selected times
      Object.entries(selectedTimes).forEach(([day, slots]) => {
        if (slots && slots.length > 0) {
          slots.forEach((slot) => {
            if (slot.state === 'recurring') {
              // Periodic schedule
              request.periodicScheduleLines?.push({
                dayOfWeek: dayMapping[day],
                startHour: slot.hour,
                endHour: slot.hour + 1, // Assuming 1-hour slots
              });
            } else if (slot.state === 'once') {
              // One-time schedule
              request.onetimeScheduleLines?.push({
                scheduleDate: getNextDate(day),
                startHour: slot.hour,
                endHour: slot.hour + 1, // Assuming 1-hour slots
              });
            }
          });
        }
      });

      // Check mock mode
      if (!mockMode) {
        // Register trainer schedule only in non-mock mode
        await trainerScheduleService.registerSchedule(request);

        // Fetch updated user data after schedule registration
        const userResponse = await authService.getCurrentUser();
        if (userResponse.trainer) {
          setAccountData({
            account: userResponse.account,
            member: userResponse.member,
            trainer: userResponse.trainer,
          });
        }
      }

      // Save to local store and notify parent
      onSuccess(selectedTimes);

      if (showScheduleEdit) {
        Alert.alert('성공', '일정 수정이 완료되었습니다.');
      } else {
        Alert.alert('성공', '일정 등록이 완료되었습니다.');
      }
    } catch (error: any) {
      console.error('Schedule registration error:', error);
      Alert.alert(
        '등록 실패',
        error.message || '일정 등록에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const renderTimeSlot = (day: string, hour: number, period: 'am' | 'pm') => {
    const timeSlot = selectedTimes[day]?.find((t) => t.hour === hour);
    const state = timeSlot?.state || 'none';
    const displayHour = hour === 0 || hour === 12 ? 12 : hour % 12;

    const formatTimeRange = () => {
      if (period === 'am') {
        return hour === 0
          ? `오전 12:00 - 01:00`
          : `오전 ${displayHour.toString().padStart(2, '0')}:00 - ${(displayHour + 1)
              .toString()
              .padStart(2, '0')}:00`;
      } else {
        if (hour === 12) {
          return `오후 12:00 - 01:00`;
        } else if (hour === 23) {
          return `오후 ${displayHour.toString().padStart(2, '0')}:00 - 12:00`;
        } else {
          return `오후 ${displayHour.toString().padStart(2, '0')}:00 - ${(displayHour + 1)
            .toString()
            .padStart(2, '0')}:00`;
        }
      }
    };

    return (
      <TouchableOpacity
        key={hour}
        style={[
          styles.timeFullSlot,
          state === 'once' && styles.timeSlotOnce,
          state === 'recurring' && styles.timeSlotRecurring,
        ]}
        onPress={() => handleTimeSlotPress(day, hour)}
      >
        <View style={styles.timeSlotContent}>
          <Text
            style={[
              styles.timeFullSlotText,
              state !== 'none' && styles.timeSlotTextSelected,
            ]}
          >
            {formatTimeRange()}
          </Text>
          <View style={styles.timeSlotStateOptions}>
            <View
              style={[
                styles.stateOptionBadge,
                state === 'recurring' && styles.stateOptionActiveRecurring,
              ]}
            >
              <Ionicons
                name="repeat"
                size={14}
                color={state === 'recurring' ? 'white' : '#cbd5e1'}
              />
              <Text
                style={[
                  styles.stateOptionText,
                  state === 'recurring' && styles.stateOptionTextActive,
                ]}
              >
                반복
              </Text>
            </View>
            <View
              style={[
                styles.stateOptionBadge,
                state === 'once' && styles.stateOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.stateOptionText,
                  state === 'once' && styles.stateOptionTextActive,
                ]}
              >
                일회
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const days = ['월', '화', '수', '목', '금', '토', '일'];
  // Sort days to put expanded day first
  const sortedDays = expandedDay
    ? [expandedDay, ...days.filter((d) => d !== expandedDay)]
    : days;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scheduleHeader}>
        {(showScheduleEdit || fromDetail) && (
          <TouchableOpacity
            style={styles.scheduleBackButton}
            onPress={fromDetail && onBackToDetail ? onBackToDetail : onCancel}
          >
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
        )}
        <Text style={styles.schedulePageTitle}>
          {showScheduleEdit ? '일정 수정' : '운영 가능한 일정을 등록하세요'}
        </Text>
        <Text style={styles.scheduleSubtitle}>
          회원들이 수업을 신청할 수 있는 시간대를 설정합니다
        </Text>
        <View style={styles.helpContainer}>
          <View style={styles.helpItem}>
            <View
              style={[
                styles.helpIndicator,
                { backgroundColor: 'rgba(139, 92, 246, 0.3)' },
              ]}
            >
              <Ionicons name="repeat" size={12} color="white" />
              <Text style={styles.helpIndicatorText}>반복</Text>
            </View>
            <Text style={styles.helpText}>매주 반복</Text>
          </View>
          <View style={styles.helpItem}>
            <View
              style={[
                styles.helpIndicator,
                { backgroundColor: 'rgba(91, 153, 247, 0.3)' },
              ]}
            >
              <Text style={styles.helpIndicatorText}>일회</Text>
            </View>
            <Text style={styles.helpText}>한 번만</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scheduleScrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.daysContainer}>
          {sortedDays.map((day) => (
            <View key={day} style={styles.daySection}>
              <TouchableOpacity
                style={[
                  styles.dayButton,
                  expandedDay === day && styles.dayButtonActive,
                ]}
                onPress={() => setExpandedDay(expandedDay === day ? null : day)}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    expandedDay === day && styles.dayButtonTextActive,
                  ]}
                >
                  {day}요일
                </Text>
                <View style={styles.dayButtonRight}>
                  {selectedTimes[day]?.length > 0 && (
                    <View style={styles.dayCountBadge}>
                      <Text style={styles.dayCountText}>
                        {selectedTimes[day].length}
                      </Text>
                    </View>
                  )}
                  <Ionicons
                    name={expandedDay === day ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="white"
                    style={{ marginLeft: 8 }}
                  />
                </View>
              </TouchableOpacity>

              {expandedDay === day && (
                <View style={styles.timeFullSlots}>
                  <ScrollView
                    style={styles.timeFullSlotsScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Morning Section */}
                    <View style={styles.timePeriodSection}>
                      <Text style={styles.timePeriodLabel}>오전</Text>
                      {Array.from({ length: 12 }, (_, i) => i).map((hour) =>
                        renderTimeSlot(day, hour, 'am')
                      )}
                    </View>

                    {/* Afternoon/Evening Section */}
                    <View style={styles.timePeriodSection}>
                      <Text style={styles.timePeriodLabel}>오후</Text>
                      {Array.from({ length: 12 }, (_, i) => i + 12).map((hour) =>
                        renderTimeSlot(day, hour, 'pm')
                      )}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.scheduleBottomBar}>
        <TouchableOpacity
          style={[
            styles.scheduleSubmitButton,
            Object.keys(selectedTimes).some((day) => selectedTimes[day]?.length > 0)
              ? styles.scheduleSubmitButtonActive
              : styles.scheduleSubmitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            !Object.keys(selectedTimes).some((day) => selectedTimes[day]?.length > 0) ||
            isSubmittingSchedule
          }
        >
          {isSubmittingSchedule ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.scheduleSubmitButtonText}>
              {expandedDay
                ? '완료'
                : showScheduleEdit
                ? '수정 요청 완료'
                : '일정 등록 완료'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scheduleHeader: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
  },
  scheduleBackButton: {
    position: 'absolute',
    left: 20,
    top: 40,
    padding: 4,
    zIndex: 1,
  },
  schedulePageTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  scheduleSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  helpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpIndicator: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  helpIndicatorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  helpText: {
    color: '#666',
    fontSize: 12,
  },
  scheduleScrollView: {
    flex: 1,
  },
  daysContainer: {
    padding: 16,
  },
  daySection: {
    marginBottom: 12,
  },
  dayButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dayButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3B82F6',
  },
  dayButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    fontWeight: '700',
    color: '#3B82F6',
  },
  dayButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayCountBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  dayCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  timeFullSlots: {
    marginTop: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  timeFullSlotsScroll: {
    maxHeight: 350,
  },
  timePeriodSection: {
    marginBottom: 20,
  },
  timePeriodLabel: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#e9ecef',
    alignSelf: 'flex-start',
    borderRadius: 6,
  },
  timeFullSlot: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  timeSlotOnce: {
    backgroundColor: 'rgba(91, 153, 247, 0.3)',
    borderWidth: 2,
    borderColor: '#5B99F7',
  },
  timeSlotRecurring: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  timeSlotContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeFullSlotText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  timeSlotTextSelected: {
    color: '#1F2937',
    fontWeight: '600',
  },
  timeSlotStateOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  stateOptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(203, 213, 225, 0.3)',
    gap: 4,
  },
  stateOptionActive: {
    backgroundColor: '#3B82F6',
  },
  stateOptionActiveRecurring: {
    backgroundColor: '#8B5CF6',
  },
  stateOptionText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  stateOptionTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  scheduleBottomBar: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  scheduleSubmitButton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  scheduleSubmitButtonActive: {
    backgroundColor: '#3B82F6',
  },
  scheduleSubmitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  scheduleSubmitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
