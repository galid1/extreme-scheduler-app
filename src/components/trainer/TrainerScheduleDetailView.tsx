import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import WeekInfo from '@/src/components/WeekInfo';
import { Schedule } from '@/src/types/api';

type TimeSlotState = 'none' | 'once' | 'recurring';

interface TimeSlotSelection {
  hour: number;
  state: TimeSlotState;
}

interface TrainerScheduleDetailViewProps {
  periodicScheduleLines: Schedule[];
  onetimeScheduleLines: Schedule[];
  onClose: () => void;
  onEdit: () => void;
}

export default function TrainerScheduleDetailView({
  periodicScheduleLines,
  onetimeScheduleLines,
  onClose,
  onEdit,
}: TrainerScheduleDetailViewProps) {
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Transform API response to TimeSlotSelection format
  const freeTimeScheduleList = useMemo(() => {
    if (onetimeScheduleLines.length === 0 && periodicScheduleLines.length === 0) {
      return {};
    }

    const dayMapping: { [key: string]: string } = {
      'MONDAY': '월',
      'TUESDAY': '화',
      'WEDNESDAY': '수',
      'THURSDAY': '목',
      'FRIDAY': '금',
      'SATURDAY': '토',
      'SUNDAY': '일',
    };

    const transformedSchedule: { [key: string]: TimeSlotSelection[] } = {};

    // Process periodic schedules (recurring)
    periodicScheduleLines.forEach((schedule) => {
      if (schedule.dayOfWeek) {
        const day = dayMapping[schedule.dayOfWeek];
        if (!transformedSchedule[day]) {
          transformedSchedule[day] = [];
        }
        transformedSchedule[day].push({
          hour: schedule.startHour,
          state: 'recurring',
        });
      }
    });

    // Process one-time schedules
    onetimeScheduleLines.forEach((schedule) => {
      if (schedule.scheduleDate) {
        const date = new Date(schedule.scheduleDate);
        const dayIndex = date.getDay();
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const day = days[dayIndex];

        if (!transformedSchedule[day]) {
          transformedSchedule[day] = [];
        }

        transformedSchedule[day].push({
          hour: schedule.startHour,
          state: 'once',
        });
      }
    });

    // Sort time slots by hour for each day
    Object.keys(transformedSchedule).forEach((day) => {
      transformedSchedule[day].sort((a, b) => a.hour - b.hour);
    });

    return transformedSchedule;
  }, [periodicScheduleLines, onetimeScheduleLines]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'white' }]}>
      <View style={styles.scheduleDetailHeader}>
        <TouchableOpacity
          style={styles.scheduleDetailBackButton}
          onPress={onClose}
        >
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <View style={styles.scheduleDetailTitleContainer}>
          <Text style={styles.scheduleDetailTitle}>등록된 일정</Text>
          <WeekInfo style={styles.scheduleDetailWeekInfo} />
        </View>
        <TouchableOpacity
          style={styles.scheduleDetailEditButton}
          onPress={onEdit}
        >
          <Ionicons name="create-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.scheduleCalendarContainer}>
        {/* Days header */}
        <View style={styles.calendarHeader}>
          <View style={styles.timeColumnHeader} />
          {days.map((day) => (
            <View key={day} style={styles.dayColumnHeader}>
              <Text style={styles.dayColumnText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Time grid */}
        <ScrollView style={styles.calendarBody} showsVerticalScrollIndicator={false}>
          {hours.map((hour) => {
            const isPM = hour >= 12;
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            const period = isPM ? '오후🌙' : '오전☀️';

            return (
              <View key={hour} style={[styles.timeRow, isPM && styles.timeRowPM]}>
                <View style={[styles.timeLabel, isPM && styles.timeLabelPM]}>
                  <Text style={styles.timeLabelPeriod}>{period}</Text>
                  <Text style={styles.timeLabelText}>{displayHour}시</Text>
                </View>
                {days.map((day) => {
                  const timeSlot = freeTimeScheduleList?.[day]?.find((t) => t.hour === hour);
                  const state = timeSlot?.state || 'none';

                  return (
                    <View
                      key={`${day}-${hour}`}
                      style={[
                        styles.timeCell,
                        isPM && styles.timeCellPM,
                        state === 'once' && styles.timeCellOnce,
                        state === 'recurring' && styles.timeCellRecurring,
                      ]}
                    >
                      {state === 'recurring' && (
                        <View style={styles.timeCellIndicator}>
                          <Ionicons name="repeat" size={12} color="white" />
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={styles.calendarLegend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: '#3B82F6', borderWidth: 1, borderColor: '#3B82F6' },
            ]}
          />
          <Text style={styles.legendText}>일회</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: '#8B5CF6', borderWidth: 1, borderColor: '#8B5CF6' },
            ]}
          />
          <Text style={styles.legendText}>매주 반복</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scheduleDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scheduleDetailBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleDetailEditButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleDetailTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  scheduleDetailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  scheduleDetailWeekInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  scheduleCalendarContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  timeColumnHeader: {
    width: 80,
  },
  dayColumnHeader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayColumnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  calendarBody: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeRowPM: {
    backgroundColor: '#FAFAFA',
  },
  timeLabel: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  timeLabelPM: {
    backgroundColor: '#F9FAFB',
  },
  timeLabelPeriod: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  timeLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  timeCell: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeCellPM: {
    backgroundColor: '#FAFAFA',
  },
  timeCellOnce: {
    backgroundColor: '#3B82F6',
  },
  timeCellRecurring: {
    backgroundColor: '#8B5CF6',
  },
  timeCellIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
});
