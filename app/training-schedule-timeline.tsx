import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
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

export default function TrainingScheduleTimelineScreen() {
  const router = useRouter();
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
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

      // Mock data - same as main schedule page
      const mockSessions: TrainingSession[] = [
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

  const getSortedSessions = () => {
    const dayOrder = ['일', '월', '화', '수', '목', '금', '토'];
    const currentDay = dayOrder[currentTime.getDay()];
    const currentHour = currentTime.getHours();

    // Sort all sessions chronologically
    return [...trainingSessions].sort((a, b) => {
      const aDayIndex = dayOrder.indexOf(a.day);
      const bDayIndex = dayOrder.indexOf(b.day);
      const currentDayIndex = dayOrder.indexOf(currentDay);

      // Calculate days from current day
      const aDaysFromNow = (aDayIndex - currentDayIndex + 7) % 7;
      const bDaysFromNow = (bDayIndex - currentDayIndex + 7) % 7;

      if (aDaysFromNow !== bDaysFromNow) {
        return aDaysFromNow - bDaysFromNow;
      }
      return a.hour - b.hour;
    });
  };

  const isUpcoming = (session: TrainingSession) => {
    const dayOrder = ['일', '월', '화', '수', '목', '금', '토'];
    const currentDay = dayOrder[currentTime.getDay()];
    const currentHour = currentTime.getHours();
    const dayIndex = dayOrder.indexOf(session.day);
    const currentDayIndex = dayOrder.indexOf(currentDay);
    const daysFromNow = (dayIndex - currentDayIndex + 7) % 7;

    if (daysFromNow === 0) {
      return session.hour > currentHour;
    }
    return true;
  };

  const formatTime = (hour: number) => {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? '오전' : '오후';
    return `${period} ${displayHour}시`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>일정을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sortedSessions = getSortedSessions();
  let currentDay = '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>일정 타임라인</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.timelineScroll}
        showsVerticalScrollIndicator={false}
      >
        {sortedSessions.map((session, index) => {
          const showDayHeader = session.day !== currentDay;
          currentDay = session.day;
          const upcoming = isUpcoming(session);
          const isNext = index === 0 && upcoming;

          return (
            <View key={`${session.memberId}-${session.day}-${session.hour}`}>
              {showDayHeader && (
                <View style={styles.dayHeader}>
                  <Text style={styles.dayHeaderText}>{session.day}요일</Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.sessionCard,
                  !upcoming && styles.pastSession,
                  isNext && styles.nextSession,
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.timeColumn}>
                  <Text style={[styles.timeText, !upcoming && styles.pastText]}>
                    {formatTime(session.hour)}
                  </Text>
                  {isNext && (
                    <View style={styles.nextBadge}>
                      <Text style={styles.nextBadgeText}>다음</Text>
                    </View>
                  )}
                </View>
                <View style={styles.sessionContent}>
                  <View style={styles.memberInfo}>
                    <Ionicons
                      name="person-circle"
                      size={36}
                      color={upcoming ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)"}
                    />
                    <View>
                      <Text style={[styles.memberName, !upcoming && styles.pastText]}>
                        {session.memberName}
                      </Text>
                      <Text style={[styles.memberPhone, !upcoming && styles.pastText]}>
                        {session.memberPhone}
                      </Text>
                    </View>
                  </View>
                  {!upcoming && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.5)" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B82F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
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
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  timelineScroll: {
    flex: 1,
  },
  dayHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dayHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pastSession: {
    opacity: 0.6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  nextSession: {
    backgroundColor: 'rgba(91, 153, 247, 0.4)',
    borderColor: '#5B99F7',
    borderWidth: 2,
  },
  timeColumn: {
    marginRight: 16,
    alignItems: 'center',
    minWidth: 60,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  pastText: {
    color: 'rgba(255,255,255,0.6)',
  },
  nextBadge: {
    backgroundColor: '#5B99F7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  nextBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  sessionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  memberPhone: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  completedBadge: {
    marginRight: 8,
  },
});