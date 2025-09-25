import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useTrainingStore } from '@/src/store/useTrainingStore';
import WeekNavigator from '@/src/components/training/WeekNavigator';
import WeekCalendarView from '@/src/components/training/WeekCalendarView';


export default function TrainingScheduleScreen() {
  const router = useRouter();
  const { setScheduleStatus } = useAuthStore();
  const {
    trainingSessions,
    currentWeek,
    totalWeeks,
    selectedMember,
    weekNotificationStatus,
    setTrainingSessions,
    setCurrentWeek,
    setSelectedMember,
    setWeekNotificationSent,
    getSessionsForWeek,
    canEditWeek,
    canSendNotification,
    isCurrentWeek,
    isPastWeek,
    isNextWeek,
    resetWeek,
    resetTraining
  } = useTrainingStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [currentTime] = useState(new Date());
  const calendarScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchTrainingSessions();
  }, []);

  useEffect(() => {
    // 지난 주차가 선택되어 있다면 현재 주차로 자동 이동
    // currentWeek가 0이거나 설정되지 않은 경우에만 현재 주차로 설정
    if (!currentWeek || currentWeek === 0) {
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const daysSinceStart = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
      const realCurrentWeek = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
      setCurrentWeek(realCurrentWeek);
    }
  }, []);

  const fetchTrainingSessions = async () => {
    setIsLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate mock data for multiple weeks
      const generateSessionsForWeek = (weekOfYear: number) => {
        const baseMembers = [
          { memberId: 'member_001', memberName: '김민수', memberPhone: '010-1234-5678', hour: 9, day: '월', weekOfYear },
          { memberId: 'member_002', memberName: '이영희', memberPhone: '010-2345-6789', hour: 10, day: '월', weekOfYear },
          { memberId: 'member_003', memberName: '박철수', memberPhone: '010-3456-7890', hour: 11, day: '월', weekOfYear },
          { memberId: 'member_004', memberName: '정미영', memberPhone: '010-4567-8901', hour: 14, day: '화', weekOfYear },
          { memberId: 'member_005', memberName: '최준호', memberPhone: '010-5678-9012', hour: 15, day: '화', weekOfYear },
          { memberId: 'member_006', memberName: '강서연', memberPhone: '010-6789-0123', hour: 16, day: '화', weekOfYear },
          { memberId: 'member_007', memberName: '박준호', memberPhone: '010-7890-1234', hour: 9, day: '수', weekOfYear },
          { memberId: 'member_008', memberName: '최수진', memberPhone: '010-8901-2345', hour: 11, day: '수', weekOfYear },
          { memberId: 'member_009', memberName: '이동혁', memberPhone: '010-9012-3456', hour: 13, day: '수', weekOfYear },
          { memberId: 'member_010', memberName: '김지은', memberPhone: '010-0123-4567', hour: 15, day: '수', weekOfYear },
          { memberId: 'member_011', memberName: '장민호', memberPhone: '010-1234-0987', hour: 10, day: '목', weekOfYear },
          { memberId: 'member_012', memberName: '윤서연', memberPhone: '010-2345-0987', hour: 14, day: '목', weekOfYear },
          { memberId: 'member_013', memberName: '한소연', memberPhone: '010-3456-0987', hour: 16, day: '목', weekOfYear },
          { memberId: 'member_014', memberName: '오지훈', memberPhone: '010-4567-0987', hour: 9, day: '금', weekOfYear },
          { memberId: 'member_015', memberName: '신유나', memberPhone: '010-5678-0987', hour: 11, day: '금', weekOfYear },
        ];

        return baseMembers;
      };

      // Get current week of year
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const daysSinceStart = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
      const currentWeekOfYear = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);

      // Generate sessions for the week stored in state or current week
      const weekToGenerate = currentWeek || currentWeekOfYear;

      // Generate sessions for selected week and next 3 weeks
      const allSessions: any[] = [];
      for (let i = 0; i < 4; i++) {
        const weekNum = weekToGenerate + i;
        if (weekNum <= 52) { // Max 52 weeks in a year
          allSessions.push(...generateSessionsForWeek(weekNum));
        }
      }

      setTrainingSessions(allSessions);
    } catch (error) {
      console.error('Error fetching training sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMemberSessionTimes = (memberId: string, week: number) => {
    return getSessionsForWeek(week)
      .filter(session => session.memberId === memberId)
      .map(session => ({
        day: session.day,
        hour: session.hour
      }));
  };

  const getUpcomingSessions = () => {
    const dayOrder = ['일', '월', '화', '수', '목', '금', '토'];
    const currentDay = dayOrder[currentTime.getDay()];
    const currentHour = currentTime.getHours();
    const weekSessions = getSessionsForWeek(currentWeek);

    // Sort sessions by day and time
    const sortedSessions = [...weekSessions].sort((a, b) => {
      const aDayIndex = dayOrder.indexOf(a.day);
      const bDayIndex = dayOrder.indexOf(b.day);
      const currentDayIndex = dayOrder.indexOf(currentDay);

      // Calculate days from current day (handle week wrap)
      const aDaysFromNow = (aDayIndex - currentDayIndex + 7) % 7;
      const bDaysFromNow = (bDayIndex - currentDayIndex + 7) % 7;

      if (aDaysFromNow !== bDaysFromNow) {
        return aDaysFromNow - bDaysFromNow;
      }
      return a.hour - b.hour;
    });

    // Filter upcoming sessions only if this is the current week
    if (isCurrentWeek(currentWeek)) {
      const upcoming = sortedSessions.filter(session => {
        const dayIndex = dayOrder.indexOf(session.day);
        const currentDayIndex = dayOrder.indexOf(currentDay);
        const daysFromNow = (dayIndex - currentDayIndex + 7) % 7;

        if (daysFromNow === 0) {
          return session.hour > currentHour;
        }
        return true;
      });
      return upcoming.slice(0, 2);
    }

    // For future weeks, return first 2 sessions
    return sortedSessions.slice(0, 2);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>트레이닝 일정을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get unique members for current week
  const weekSessions = getSessionsForWeek(currentWeek);
  const uniqueMembers = Array.from(new Set(weekSessions.map(s => s.memberId)))
    .map(id => {
      const session = weekSessions.find(s => s.memberId === id);
      const sessionTimes = getMemberSessionTimes(id, currentWeek);
      return session ? {
        id,
        name: session.memberName,
        phone: session.memberPhone,
        sessionTimes,
      } : null;
    })
    .filter(Boolean);

  const upcomingSessions = getUpcomingSessions();

  // Get all upcoming sessions for horizontal scroll
  const getAllUpcomingSessions = () => {
    const dayOrder = ['일', '월', '화', '수', '목', '금', '토'];
    const currentDay = dayOrder[currentTime.getDay()];
    const currentHour = currentTime.getHours();
    const weekSessions = getSessionsForWeek(currentWeek);

    // Sort sessions by day and time
    const sortedSessions = [...weekSessions].sort((a, b) => {
      const aDayIndex = dayOrder.indexOf(a.day);
      const bDayIndex = dayOrder.indexOf(b.day);
      const currentDayIndex = dayOrder.indexOf(currentDay);

      // Calculate days from current day (handle week wrap)
      const aDaysFromNow = (aDayIndex - currentDayIndex + 7) % 7;
      const bDaysFromNow = (bDayIndex - currentDayIndex + 7) % 7;

      if (aDaysFromNow !== bDaysFromNow) {
        return aDaysFromNow - bDaysFromNow;
      }
      return a.hour - b.hour;
    });

    // Filter upcoming sessions only if this is the current week
    if (isCurrentWeek(currentWeek)) {
      return sortedSessions.filter(session => {
        const dayIndex = dayOrder.indexOf(session.day);
        const currentDayIndex = dayOrder.indexOf(currentDay);
        const daysFromNow = (dayIndex - currentDayIndex + 7) % 7;

        if (daysFromNow === 0) {
          return session.hour > currentHour;
        }
        return true;
      });
    }

    // For future weeks, return all sessions
    return sortedSessions;
  };

  const allUpcomingSessions = getAllUpcomingSessions();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.title}>트레이닝 일정</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Week Navigator */}
      <WeekNavigator
        currentWeek={currentWeek}
        totalWeeks={totalWeeks}
        onWeekChange={setCurrentWeek}
        isCurrentWeek={isCurrentWeek(currentWeek)}
        isPastWeek={isPastWeek(currentWeek)}
        isNextWeek={isNextWeek(currentWeek)}
      />

      {/* Upcoming Sessions */}
      <View style={styles.upcomingSection}>
        <View style={styles.upcomingHeader}>
          <Text style={styles.upcomingTitle}>다음 일정</Text>
          {allUpcomingSessions.length > 0 && (() => {
            const firstSession = allUpcomingSessions[0];
            const dayOrder = ['일', '월', '화', '수', '목', '금', '토'];
            const currentDate = new Date();
            const currentDayIndex = currentDate.getDay();
            const currentHour = currentDate.getHours();
            const sessionDayIndex = dayOrder.indexOf(firstSession.day);
            const daysToAdd = (sessionDayIndex - currentDayIndex + 7) % 7;
            const hoursUntil = daysToAdd === 0 ? firstSession.hour - currentHour : (daysToAdd * 24) + (firstSession.hour - currentHour);
            return null;
          })()}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.upcomingScrollContent}
        >
          {allUpcomingSessions.length > 0 ? (
            allUpcomingSessions.map((session, idx) => {
              const displayHour = session.hour === 0 ? 12 : session.hour > 12 ? session.hour - 12 : session.hour;
              const period = session.hour < 12 ? '오전' : '오후';
              const isNext = idx === 0;

              // Calculate date for the session considering week difference
              const dayOrder = ['일', '월', '화', '수', '목', '금', '토'];
              const currentDate = new Date();
              const currentDayIndex = currentDate.getDay();
              const currentHour = currentDate.getHours();
              const sessionDayIndex = dayOrder.indexOf(session.day);

              // Get current week of year
              const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
              const daysSinceStart = Math.floor((currentDate - startOfYear) / (24 * 60 * 60 * 1000));
              const currentWeekOfYear = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);

              // Calculate week difference
              const weekDiff = session.weekOfYear - currentWeekOfYear;

              // Calculate days to add considering week difference
              let daysToAdd = (sessionDayIndex - currentDayIndex + 7) % 7;
              if (weekDiff > 0) {
                daysToAdd += weekDiff * 7;
              } else if (weekDiff === 0 && daysToAdd === 0 && session.hour <= currentHour) {
                // If same day but past time, it means next week
                daysToAdd = 7;
              }

              const sessionDate = new Date(currentDate);
              sessionDate.setDate(currentDate.getDate() + daysToAdd);
              const month = sessionDate.getMonth() + 1;
              const day = sessionDate.getDate();

              // Check if today and calculate hours until session
              const isToday = daysToAdd === 0 && weekDiff === 0;
              const hoursUntil = session.hour - currentHour + (daysToAdd * 24);
              const isWithin12Hours = hoursUntil <= 12 && hoursUntil > 0;
              const isWithin24Hours = hoursUntil <= 24 && hoursUntil > 0;

              return (
                <TouchableOpacity
                  key={`${session.memberId}-${session.day}-${session.hour}`}
                  style={styles.cardWrapper}
                  onPress={() => {
                    setSelectedMember(session.memberId);
                    // Scroll to the member's session hour in calendar
                    if (calendarScrollRef.current) {
                      const scrollY = session.hour * 50; // 50 is hourRow height
                      calendarScrollRef.current.scrollTo({ y: scrollY, animated: true });
                    }
                  }}
                  activeOpacity={0.8}
                >
                  {isNext && (
                      <View style={styles.nextBadgeTop}>
                          <Ionicons name="arrow-forward-circle" size={14} color="white" />
                          <Text style={styles.nextBadgeTopText}>다음 수업</Text>
                      </View>
                  )}
                  <View style={[styles.upcomingCard, isNext && styles.nextCard, selectedMember === session.memberId && styles.selectedUpcomingCard]}>
                  <View style={styles.upcomingTimeInfo}>
                      <View style={styles.upcomingMemberInfo}>
                          <Ionicons
                              name="person-circle"
                              size={32}
                              color={isNext ? "white" : "#3B82F6"}
                          />
                          <Text style={[styles.upcomingMemberName, isNext && styles.nextText]}>
                              {session.memberName}
                          </Text>
                      </View>

                      <View style={styles.upcomingDayRow}>
                      {isToday ? (
                          <View style={styles.nextDayRow}>
                              <Text style={[styles.upcomingDay, isNext && styles.nextText]}>
                                오늘
                              </Text>
                              <Text style={[styles.upcomingHoursUntil, isNext && styles.nextTimeText]}>
                              {hoursUntil}시간 후
                            </Text>
                          </View>
                      ) : (
                        <View style={styles.nextDayRow}>
                          <Text style={[styles.upcomingDay, isNext && styles.nextText]}>
                              {month}/{day} {session.day}요일
                          </Text>
                            <Text style={[styles.upcomingTime, isNext && styles.nextText]}>
                                {period} {displayHour}시
                            </Text>
                        </View>
                      )}
                    </View>

                  </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.noUpcomingText}>오늘 남은 일정이 없습니다</Text>
          )}
        </ScrollView>
      </View>

      {/* Calendar View */}
      <View style={styles.calendarContainer}>
        <WeekCalendarView
          sessions={weekSessions}
          selectedMember={selectedMember}
          onSelectMember={setSelectedMember}
          scrollRef={calendarScrollRef}
          isCurrentWeek={isCurrentWeek(currentWeek)}
          currentWeek={currentWeek}
        />
      </View>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.notificationButton,
            (!canSendNotification(currentWeek) || weekNotificationStatus[currentWeek]) && styles.notificationButtonDisabled
          ]}
          onPress={() => {
            if (canSendNotification(currentWeek)) {
              if (isCurrentWeek(currentWeek)) {
                Alert.alert(
                  '알림 발송 불가',
                  '이번 주차는 알림을 발송할 수 없습니다.\n다음 주차부터 알림 발송이 가능합니다.',
                  [{ text: '확인', style: 'default' }]
                );
              } else {
                Alert.alert(
                  '알림 발송 확인',
                  `${currentWeek}주차 트레이닝 일정을 모든 회원에게 발송하시겠습니까?`,
                  [
                    { text: '취소', style: 'cancel' },
                    {
                      text: '발송',
                      onPress: async () => {
                        setIsSendingNotification(true);
                        // Simulate notification sending
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        setWeekNotificationSent(currentWeek, true);
                        setIsSendingNotification(false);
                        Alert.alert('알림 발송 완료', `${currentWeek}주차 일정 알림이 발송되었습니다.`);
                      }
                    }
                  ]
                );
              }
            }
          }}
          disabled={!canSendNotification(currentWeek) || weekNotificationStatus[currentWeek] || isSendingNotification}
        >
          {isSendingNotification ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons
                name={weekNotificationStatus[currentWeek] ? "checkmark-circle" : isCurrentWeek(currentWeek) ? "lock-closed" : "notifications-outline"}
                size={18}
                color="white"
              />
              <Text style={styles.notificationButtonText}>
                {weekNotificationStatus[currentWeek] ? '알림발송 완료' : isCurrentWeek(currentWeek) ? '알림 불가' : '알림 발송'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.weekResetButton,
            (isPastWeek(currentWeek) || isCurrentWeek(currentWeek)) && styles.weekResetButtonDisabled
          ]}
          onPress={() => {
            if (!isPastWeek(currentWeek) && !isCurrentWeek(currentWeek)) {
              Alert.alert(
                `${currentWeek}주차 일정 재설정`,
                `${currentWeek}주차 트레이닝 일정을 재설정 하시겠습니까?`,
                [
                  { text: '취소', style: 'cancel' },
                  {
                    text: '재설정',
                    onPress: () => {
                      // Store에 재설정할 주차 정보 저장
                      resetWeek(currentWeek);
                      // 자동 스케줄링 화면으로 이동 (주차 정보 전달)
                      router.push({
                        pathname: '/auto-scheduling',
                        params: {
                          weekToReset: currentWeek,
                          resetMode: true
                        }
                      });
                    }
                  }
                ]
              );
            }
          }}
          disabled={isPastWeek(currentWeek) || isCurrentWeek(currentWeek)}
        >
          <Ionicons name="refresh" size={18} color="white" />
          <Text style={styles.weekResetButtonText}>주차 재설정</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#333',
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  membersSummary: {
    paddingVertical: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  membersScroll: {
    paddingHorizontal: 12,
  },
  memberCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 8,
    marginHorizontal: 3,
    alignItems: 'center',
    minWidth: 75,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  memberCardSelected: {
    backgroundColor: 'rgba(91, 153, 247, 0.3)',
    borderColor: '#5B99F7',
    borderWidth: 2,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionTimesList: {
    alignItems: 'center',
  },
  sessionTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    marginBottom: 1,
  },
  upcomingSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  nextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  nextBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  upcomingScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingTop: 5,
  },
  cardWrapper: {
    width: 130,
    marginTop: 12,
  },
  nextBadgeTop: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -35 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
    zIndex: 10,
    elevation: 5,
  },
  nextBadgeTopText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  upcomingCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: 130,
  },
  selectedUpcomingCard: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  nextCard: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  upcomingTimeInfo: {
    marginBottom: 2,
  },
  upcomingDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
    nextDayRow: {
        padding: 5,
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
  upcomingDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  upcomingHoursUntil: {
    fontSize: 14,
    fontWeight: '700',
  },
  upcomingDay: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  upcomingTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  upcomingMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upcomingMemberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  nextText: {
    color: 'white',
  },
    nextTimeText: {
        color: 'yellow',
        fontWeight: '700',
    },
  noUpcomingText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  calendarContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  timeColumn: {
    width: 60,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },
  dayHeaderText: {
    color: '#333',
    fontSize: 14,
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
  timeCell: {
    width: 60,
    justifyContent: 'center',
    paddingRight: 8,
    alignItems: 'center',
  },
  timeCellPM: {
    backgroundColor: '#E8F2FF',
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
  dayCellWithSession: {
    backgroundColor: '#3B82F6',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  dayCellSelectedMember: {
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  dayCellOtherMember: {
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  sessionMemberName: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  notificationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  notificationButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.8,
  },
  notificationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  weekResetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  weekResetButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.8,
  },
  weekResetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
