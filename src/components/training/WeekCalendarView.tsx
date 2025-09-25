import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TrainingSession {
  memberId: string;
  memberName: string;
  memberPhone: string;
  hour: number;
  day: string;
  week: number;
}

interface WeekCalendarViewProps {
  sessions: TrainingSession[];
  selectedMember: string | null;
  onSelectMember: (memberId: string) => void;
  scrollRef?: React.RefObject<ScrollView>;
  isCurrentWeek?: boolean;
}

export default function WeekCalendarView({
  sessions,
  selectedMember,
  onSelectMember,
  scrollRef,
  isCurrentWeek = false
}: WeekCalendarViewProps) {
  const currentTime = new Date();
  const currentDay = ['일', '월', '화', '수', '목', '금', '토'][currentTime.getDay()];
  const currentHour = currentTime.getHours();

  // 오늘인지 확인하는 함수
  const isToday = (day: string) => {
    return isCurrentWeek && day === currentDay;
  };

  // 현재 시간인지 확인하는 함수
  const isCurrentHour = (hour: number) => {
    return isCurrentWeek && hour === currentHour;
  };

  // 지난 시간인지 확인하는 함수
  const isPastSession = (day: string, hour: number) => {
    if (!isCurrentWeek) return false;

    const dayOrder = ['일', '월', '화', '수', '목', '금', '토'];
    const dayIndex = dayOrder.indexOf(day);
    const currentDayIndex = dayOrder.indexOf(currentDay);

    if (dayIndex < currentDayIndex) return true;
    if (dayIndex === currentDayIndex && hour < currentHour) return true;
    return false;
  };

  return (
    <View style={styles.container}>
      {/* Calendar Header with Days */}
      <View style={styles.calendarHeader}>
        <View style={styles.timeColumn} />
        {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
          <View
            key={day}
            style={[
              styles.dayHeader,
              isToday(day) && styles.todayHeader
            ]}
          >
            <Text style={[
              styles.dayHeaderText,
              isToday(day) && styles.todayHeaderText
            ]}>
              {day}
            </Text>
            {isToday(day) && (
              <View style={styles.todayIndicator}>
                <Text style={styles.todayIndicatorText}>오늘</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Calendar Body */}
      <ScrollView
        ref={scrollRef}
        style={styles.calendarBody}
        showsVerticalScrollIndicator={false}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((hour) => {
          const isPM = hour >= 12;
          const displayHour = hour === 12 ? 12 : hour > 12 ? hour - 12 : hour;
          const period = isPM ? '오후🌙' : '오전☀️';
          const isCurrent = isCurrentHour(hour);

          return (
            <View
              key={`hour-${hour}`}
              style={[
                styles.hourRow,
                isPM && styles.hourRowPM,
                isCurrent && styles.currentHourRow
              ]}
            >
              <View style={[
                styles.timeCell,
                isPM && styles.timeCellPM,
                isCurrent && styles.currentTimeCell
              ]}>
                <Text style={styles.periodText}>{period}</Text>
                <Text style={[
                  styles.timeText,
                  isCurrent && styles.currentTimeText
                ]}>
                  {displayHour}시
                </Text>
              </View>
              {['월', '화', '수', '목', '금', '토', '일'].map((day) => {
                const session = sessions.find(
                  s => s.day === day && s.hour === hour
                );
                const isSelectedMember = selectedMember && session?.memberId === selectedMember;
                const isOtherMember = selectedMember && session && session.memberId !== selectedMember;
                const isPast = isPastSession(day, hour);

                return (
                  <TouchableOpacity
                    key={`${day}-${hour}`}
                    style={[
                      styles.dayCell,
                      isPM && styles.dayCellPM,
                      session && !isOtherMember && !isPast && styles.dayCellWithSession,
                      isSelectedMember && !isPast && styles.dayCellSelectedMember,
                      isOtherMember && styles.dayCellOtherMember,
                      isPast && styles.dayCellPast,
                      isPast && session && styles.dayCellPastWithSession,
                      isToday(day) && styles.dayCellToday,
                      isCurrent && isToday(day) && styles.currentCell
                    ]}
                    onPress={() => session && !isPast && onSelectMember(session.memberId)}
                    disabled={!session || isPast}
                    activeOpacity={0.8}
                  >
                    {session && (
                      <>
                        <Text
                          style={[
                            styles.sessionMemberName,
                            isPast && styles.sessionMemberNamePast
                          ]}
                          numberOfLines={1}
                        >
                          {session.memberName}
                        </Text>
                        {isPast && (
                          <Ionicons
                            name="checkmark-circle"
                            size={12}
                            color="#6B7280"
                            style={styles.completedIcon}
                          />
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  timeColumn: {
    width: 60,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },
  todayHeader: {
    backgroundColor: '#EBF5FF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  dayHeaderText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  todayHeaderText: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  todayIndicator: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  todayIndicatorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  calendarBody: {
    flex: 1,
  },
  hourRow: {
    flexDirection: 'row',
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  hourRowPM: {
    backgroundColor: '#F0F7FF',
  },
  currentHourRow: {
    backgroundColor: '#FFF7ED',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: '#FB923C',
    borderBottomColor: '#FB923C',
  },
  timeCell: {
    width: 60,
    justifyContent: 'center',
    paddingRight: 8,
    alignItems: 'center',
  },
  timeCellPM: {
    backgroundColor: '#E8F2FF',
  },
  currentTimeCell: {
    backgroundColor: '#FED7AA',
  },
  periodText: {
    color: '#666',
    fontSize: 10,
    fontWeight: '500',
  },
  timeText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },
  currentTimeText: {
    color: '#EA580C',
    fontWeight: '700',
  },
  dayCell: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#F3F4F6',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellPM: {
    backgroundColor: '#F8FBFF',
  },
  dayCellToday: {
    backgroundColor: '#EBF5FF',
    borderLeftColor: '#BFDBFE',
  },
  currentCell: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  dayCellWithSession: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  dayCellSelectedMember: {
    backgroundColor: '#93C5FD',
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  dayCellOtherMember: {
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  dayCellPast: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },
  dayCellPastWithSession: {
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#9CA3AF',
  },
  sessionMemberName: {
    color: '#1F2937',
    fontSize: 11,
    fontWeight: '600',
  },
  sessionMemberNamePast: {
    color: '#6B7280',
    fontWeight: '500',
  },
  completedIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
});