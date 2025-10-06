import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface TrainingSession {
  memberId: string;
  memberName: string;
  memberPhone: string;
  hour: number;
  day: string;
  weekOfYear: number;
}

interface WeekCalendarViewProps {
  sessions: TrainingSession[];
  selectedMember: string | null;
  onSelectMember: (memberId: string) => void;
  scrollRef?: React.RefObject<ScrollView>;
  isCurrentWeek?: boolean;
  currentWeek: number;
  onWeekChange: (week: number) => void;
}

export default function WeekCalendarView({
  sessions,
  selectedMember,
  onSelectMember,
  scrollRef,
  isCurrentWeek = false,
  currentWeek,
  onWeekChange
}: WeekCalendarViewProps) {
  const currentTime = new Date();
  const currentDay = ['일', '월', '화', '수', '목', '금', '토'][currentTime.getDay()];
  const currentHour = currentTime.getHours();

  const horizontalScrollRef = useRef<ScrollView>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(1); // Start at middle page

  // 현재 실제 주차 계산
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const realCurrentWeek = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);

  // 표시할 주차들 (이전주, 현재주, 다음주)
  const weeks = [currentWeek - 1, currentWeek, currentWeek + 1].filter(week => week >= realCurrentWeek && week <= 52);

  // 수평 스크롤 처리
  const handleHorizontalScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);

    if (pageIndex !== currentPageIndex) {
      setCurrentPageIndex(pageIndex);
      const newWeek = weeks[pageIndex];
      if (newWeek && newWeek !== currentWeek) {
        onWeekChange(newWeek);
      }
    }
  };

  // 해당 주차의 날짜 계산
  const getWeekDates = (weekNumber: number) => {
    const year = currentTime.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const daysOffset = (weekNumber - 1) * 7;
    const weekStart = new Date(jan1.getTime() + daysOffset * 24 * 60 * 60 * 1000);

    // 월요일로 조정
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    const dates = [];
    const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);

      const isWeekCurrent = weekNumber === realCurrentWeek;
      dates.push({
        day: dayNames[i],
        date: date.getDate(),
        month: date.getMonth() + 1,
        isToday: isWeekCurrent && dayNames[i] === currentDay
      });
    }
    return dates;
  };

  // 오늘인지 확인하는 함수
  const isTodayForWeek = (day: string, weekNumber: number) => {
    return weekNumber === realCurrentWeek && day === currentDay;
  };

  // 현재 시간인지 확인하는 함수
  const isCurrentHourForWeek = (hour: number, weekNumber: number) => {
    return weekNumber === realCurrentWeek && hour === currentHour;
  };

  // 지난 시간인지 확인하는 함수
  const isPastSession = (day: string, hour: number, weekNumber: number) => {
    if (weekNumber !== realCurrentWeek) return false;

    const dayOrder = ['일', '월', '화', '수', '목', '금', '토'];
    const dayIndex = dayOrder.indexOf(day);
    const currentDayIndex = dayOrder.indexOf(currentDay);

    if (dayIndex < currentDayIndex) return true;
    if (dayIndex === currentDayIndex && hour < currentHour) return true;
    return false;
  };

  // 단일 주차 캘린더 렌더링
  const renderWeekCalendar = (weekNumber: number) => {
    const weekDates = getWeekDates(weekNumber);
    const weekSessions = sessions.filter(s => s.weekOfYear === weekNumber);

    return (
      <View key={weekNumber} style={{ width: SCREEN_WIDTH }}>
        {/* Calendar Header with Days */}
        <View style={styles.calendarHeader}>
          <View style={styles.timeColumn} />
          {weekDates.map((dateInfo) => (
            <View
              key={dateInfo.day}
              style={[
                styles.dayHeader,
                dateInfo.isToday && styles.todayHeader
              ]}
            >
              <Text style={[
                styles.dayHeaderText,
                dateInfo.isToday && styles.todayHeaderText
              ]}>
                {dateInfo.day}
              </Text>
              <Text style={[
                styles.dateText,
                dateInfo.isToday && styles.todayDateText
              ]}>
                {dateInfo.month}/{dateInfo.date}
              </Text>
              {dateInfo.isToday && (
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
            const isCurrent = isCurrentHourForWeek(hour, weekNumber);

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
                  const session = weekSessions.find(
                    s => s.day === day && s.hour === hour
                  );
                  const isSelectedMember = selectedMember && session?.memberId === selectedMember;
                  const isOtherMember = selectedMember && session && session.memberId !== selectedMember;
                  const isPast = isPastSession(day, hour, weekNumber);

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
                        isTodayForWeek(day, weekNumber) && styles.dayCellToday,
                        isCurrent && isTodayForWeek(day, weekNumber) && styles.currentCell
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
  };

  return (
    <View style={styles.container}>
      {/* Scroll Indicator */}
      <View style={styles.scrollIndicator}>
        <View style={styles.scrollIndicatorBar}>
          <Ionicons name="chevron-back" size={16} color="#9CA3AF" />
          <Text style={styles.scrollIndicatorText}>좌우로 스와이프하여 주차 변경</Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </View>
      </View>

      {/* Horizontal ScrollView for weeks */}
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleHorizontalScroll}
        scrollEventThrottle={16}
        contentOffset={{ x: SCREEN_WIDTH * currentPageIndex, y: 0 }}
      >
        {weeks.map((week) => renderWeekCalendar(week))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scrollIndicatorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scrollIndicatorText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
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
  dateText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  todayDateText: {
    color: '#3B82F6',
    fontWeight: '600',
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