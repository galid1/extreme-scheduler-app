import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface TrainingSession {
  memberId: string;
  memberName: string;
  memberPhone: string;
  hour: number;
  day: string;
}

export default function TrainingScheduleScreen() {
  const router = useRouter();
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime] = useState(new Date());

  useEffect(() => {
    fetchTrainingSessions();
  }, []);

  const fetchTrainingSessions = async () => {
    setIsLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock data - training sessions with member info (each member has ONLY ONE time slot)
      const mockSessions: TrainingSession[] = [
        // Each member appears only once in the entire schedule
        { memberId: 'member_001', memberName: '김민수', memberPhone: '010-1234-5678', hour: 9, day: '월' },
        { memberId: 'member_002', memberName: '이영희', memberPhone: '010-2345-6789', hour: 10, day: '월' },
        { memberId: 'member_003', memberName: '박철수', memberPhone: '010-3456-7890', hour: 11, day: '월' },
        { memberId: 'member_004', memberName: '정미영', memberPhone: '010-4567-8901', hour: 14, day: '화' },
        { memberId: 'member_005', memberName: '최준호', memberPhone: '010-5678-9012', hour: 15, day: '화' },
        { memberId: 'member_006', memberName: '강서연', memberPhone: '010-6789-0123', hour: 16, day: '화' },
        { memberId: 'member_007', memberName: '박준호', memberPhone: '010-7890-1234', hour: 9, day: '수' },
        { memberId: 'member_008', memberName: '최수진', memberPhone: '010-8901-2345', hour: 11, day: '수' },
        { memberId: 'member_009', memberName: '이동혁', memberPhone: '010-9012-3456', hour: 13, day: '수' },
        { memberId: 'member_010', memberName: '김지은', memberPhone: '010-0123-4567', hour: 15, day: '수' },
        { memberId: 'member_011', memberName: '장민호', memberPhone: '010-1234-0987', hour: 10, day: '목' },
        { memberId: 'member_012', memberName: '윤서연', memberPhone: '010-2345-0987', hour: 14, day: '목' },
        { memberId: 'member_013', memberName: '한소연', memberPhone: '010-3456-0987', hour: 16, day: '목' },
        { memberId: 'member_014', memberName: '오지훈', memberPhone: '010-4567-0987', hour: 9, day: '금' },
        { memberId: 'member_015', memberName: '신유나', memberPhone: '010-5678-0987', hour: 11, day: '금' },
      ];

      setTrainingSessions(mockSessions);
    } catch (error) {
      console.error('Error fetching training sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMemberSessionTimes = (memberId: string) => {
    return trainingSessions
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

    // Sort sessions by day and time
    const sortedSessions = [...trainingSessions].sort((a, b) => {
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

    // Filter upcoming sessions
    const upcoming = sortedSessions.filter(session => {
      const dayIndex = dayOrder.indexOf(session.day);
      const currentDayIndex = dayOrder.indexOf(currentDay);
      const daysFromNow = (dayIndex - currentDayIndex + 7) % 7;

      if (daysFromNow === 0) {
        return session.hour > currentHour;
      }
      return true;
    });

    return upcoming.slice(0, 2); // Return only next 2 sessions
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

  // Get unique members for display with their session info
  const uniqueMembers = Array.from(new Set(trainingSessions.map(s => s.memberId)))
    .map(id => {
      const session = trainingSessions.find(s => s.memberId === id);
      const sessionTimes = getMemberSessionTimes(id);
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

    // Sort sessions by day and time
    const sortedSessions = [...trainingSessions].sort((a, b) => {
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

    // Filter upcoming sessions
    return sortedSessions.filter(session => {
      const dayIndex = dayOrder.indexOf(session.day);
      const currentDayIndex = dayOrder.indexOf(currentDay);
      const daysFromNow = (dayIndex - currentDayIndex + 7) % 7;

      if (daysFromNow === 0) {
        return session.hour > currentHour;
      }
      return true;
    });
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

      {/* Upcoming Sessions */}
      <View style={styles.upcomingSection}>
        <View style={styles.upcomingHeader}>
          <Text style={styles.upcomingTitle}>다음 일정</Text>
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

              // Calculate date for the session
              const dayOrder = ['일', '월', '화', '수', '목', '금', '토'];
              const currentDate = new Date();
              const currentDayIndex = currentDate.getDay();
              const sessionDayIndex = dayOrder.indexOf(session.day);
              const daysToAdd = (sessionDayIndex - currentDayIndex + 7) % 7;
              const sessionDate = new Date(currentDate);
              sessionDate.setDate(currentDate.getDate() + daysToAdd);
              const month = sessionDate.getMonth() + 1;
              const day = sessionDate.getDate();

              return (
                <View
                  key={`${session.memberId}-${session.day}-${session.hour}`}
                  style={[styles.upcomingCard, isNext && styles.nextCard]}
                >
                  {isNext && (
                    <View style={styles.nextIndicator}>
                      <Ionicons name="arrow-forward-circle" size={16} color="yellow" />
                      <Text style={styles.nextIndicatorText}>다음 수업</Text>
                    </View>
                  )}
                  <View style={styles.upcomingTimeInfo}>
                    <View style={styles.upcomingDayRow}>
                      <Text style={[styles.upcomingDay, isNext && styles.nextText]}>
                        {session.day}요일
                      </Text>
                      <Text style={[styles.upcomingDate, isNext && styles.nextText]}>
                        ({month}/{day})
                      </Text>
                    </View>
                    <Text style={[styles.upcomingTime, isNext && styles.nextText]}>
                      {period} {displayHour}시
                    </Text>
                  </View>
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
                </View>
              );
            })
          ) : (
            <Text style={styles.noUpcomingText}>오늘 남은 일정이 없습니다</Text>
          )}
        </ScrollView>
      </View>

      {/* Calendar View */}
      <View style={styles.calendarContainer}>
        {/* Calendar Header with Days */}
        <View style={styles.calendarHeader}>
          <View style={styles.timeColumn} />
          {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
            <View key={day} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Body */}
        <ScrollView style={styles.calendarBody} showsVerticalScrollIndicator={false}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((hour) => {
            const isPM = hour >= 12;
            const displayHour = hour === 12 ? 12 : hour > 12 ? hour - 12 : hour;
            const period = isPM ? '오후🌙' : '오전☀️';

            return (
              <View key={`hour-${hour}`} style={[styles.hourRow, isPM && styles.hourRowPM]}>
                <View style={[styles.timeCell, isPM && styles.timeCellPM]}>
                  <Text style={styles.periodText}>{period}</Text>
                  <Text style={styles.timeText}>{displayHour}시</Text>
                </View>
                {['월', '화', '수', '목', '금', '토', '일'].map((day) => {
                  const session = trainingSessions.find(
                    s => s.day === day && s.hour === hour &&
                    (!selectedMember || s.memberId === selectedMember)
                  );
                  return (
                    <View
                      key={`${day}-${hour}`}
                      style={[
                        styles.dayCell,
                        isPM && styles.dayCellPM,
                        session && styles.dayCellWithSession
                      ]}
                    >
                      {session && (
                        <Text style={styles.sessionMemberName} numberOfLines={1}>
                          {session.memberName}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
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
  },
  upcomingCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: 150,
    position: 'relative',
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
  nextIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  nextIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  upcomingTimeInfo: {
    marginBottom: 2,
  },
  upcomingDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upcomingDate: {
    fontSize: 11,
    color: '#9CA3AF',
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
  sessionMemberName: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },
});
