import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface MemberInfo {
  memberId: string;
  name: string;
  phoneNumber: string;
  assignedDate: string;
  lastSessionDate?: string;
  upcomingSessions: number;
  totalSessions: number;
  scheduleStatus: 'ACTIVE' | 'PAUSED' | 'PENDING';
}

export default function ApprovedMembersScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockMembers: MemberInfo[] = [
        {
          memberId: 'member_001',
          name: '김민수',
          phoneNumber: '010-1234-5678',
          assignedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastSessionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          upcomingSessions: 3,
          totalSessions: 24,
          scheduleStatus: 'ACTIVE',
        },
        {
          memberId: 'member_002',
          name: '이영희',
          phoneNumber: '010-2345-6789',
          assignedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          lastSessionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          upcomingSessions: 2,
          totalSessions: 48,
          scheduleStatus: 'ACTIVE',
        },
        {
          memberId: 'member_003',
          name: '박철수',
          phoneNumber: '010-3456-7890',
          assignedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          upcomingSessions: 0,
          totalSessions: 12,
          scheduleStatus: 'PAUSED',
        },
        {
          memberId: 'member_004',
          name: '정수진',
          phoneNumber: '010-4567-8901',
          assignedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          lastSessionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          upcomingSessions: 4,
          totalSessions: 72,
          scheduleStatus: 'ACTIVE',
        },
        {
          memberId: 'member_005',
          name: '최동욱',
          phoneNumber: '010-5678-9012',
          assignedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          upcomingSessions: 1,
          totalSessions: 5,
          scheduleStatus: 'PENDING',
        },
        {
          memberId: 'member_006',
          name: '강미나',
          phoneNumber: '010-6789-0123',
          assignedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          lastSessionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          upcomingSessions: 2,
          totalSessions: 36,
          scheduleStatus: 'ACTIVE',
        },
        {
          memberId: 'member_007',
          name: '송지훈',
          phoneNumber: '010-7890-1234',
          assignedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          lastSessionDate: new Date().toISOString(),
          upcomingSessions: 3,
          totalSessions: 16,
          scheduleStatus: 'ACTIVE',
        },
        {
          memberId: 'member_008',
          name: '한서윤',
          phoneNumber: '010-8901-2345',
          assignedDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          lastSessionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          upcomingSessions: 1,
          totalSessions: 96,
          scheduleStatus: 'ACTIVE',
        },
        {
          memberId: 'member_009',
          name: '임도현',
          phoneNumber: '010-9012-3456',
          assignedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          upcomingSessions: 0,
          totalSessions: 8,
          scheduleStatus: 'PAUSED',
        },
        {
          memberId: 'member_010',
          name: '노유진',
          phoneNumber: '010-0123-4567',
          assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          upcomingSessions: 2,
          totalSessions: 3,
          scheduleStatus: 'PENDING',
        },
        {
          memberId: 'member_011',
          name: '윤태양',
          phoneNumber: '010-1234-6789',
          assignedDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
          lastSessionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          upcomingSessions: 3,
          totalSessions: 60,
          scheduleStatus: 'ACTIVE',
        },
        {
          memberId: 'member_012',
          name: '서현아',
          phoneNumber: '010-2345-7890',
          assignedDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          lastSessionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          upcomingSessions: 2,
          totalSessions: 144,
          scheduleStatus: 'ACTIVE',
        },
      ];

      setMembers(mockMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: 'rgba(34, 197, 94, 0.3)', border: 'rgba(34, 197, 94, 0.5)' };
      case 'PAUSED':
        return { bg: 'rgba(251, 146, 60, 0.3)', border: 'rgba(251, 146, 60, 0.5)' };
      case 'PENDING':
        return { bg: 'rgba(91, 153, 247, 0.3)', border: '#5B99F7' };
      default:
        return { bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '활성';
      case 'PAUSED':
        return '일시중지';
      case 'PENDING':
        return '대기중';
      default:
        return status;
    }
  };

  const activeMembers = members.filter(m => m.scheduleStatus === 'ACTIVE');
  const otherMembers = members.filter(m => m.scheduleStatus !== 'ACTIVE');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>담당 회원 목록</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{members.length}</Text>
          <Text style={styles.statLabel}>전체 회원</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{activeMembers.length}</Text>
          <Text style={styles.statLabel}>활성 회원</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>회원 목록을 불러오는 중...</Text>
          </View>
        ) : (
          <>
            {activeMembers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>활성 회원 ({activeMembers.length})</Text>
                {activeMembers.map((member) => (
                  <TouchableOpacity
                    key={member.memberId}
                    style={[
                      styles.memberCard,
                      selectedMember === member.memberId && styles.selectedCard
                    ]}
                    onPress={() => setSelectedMember(
                      selectedMember === member.memberId ? null : member.memberId
                    )}
                    activeOpacity={0.8}
                  >
                    <View style={styles.memberHeader}>
                      <View style={styles.memberInfo}>
                        <View style={styles.profileIcon}>
                          <Ionicons name="person-circle" size={40} color="white" />
                        </View>
                        <View style={styles.memberDetails}>
                          <Text style={styles.memberName}>{member.name}</Text>
                          <Text style={styles.memberPhone}>{member.phoneNumber}</Text>
                        </View>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusColor(member.scheduleStatus).bg,
                          borderColor: getStatusColor(member.scheduleStatus).border
                        }
                      ]}>
                        <Text style={styles.statusText}>
                          {getStatusText(member.scheduleStatus)}
                        </Text>
                      </View>
                    </View>

                    {selectedMember === member.memberId && (
                      <View style={styles.memberStats}>
                        <View style={styles.statRow}>
                          <Text style={styles.statRowLabel}>등록일</Text>
                          <Text style={styles.statRowValue}>
                            {formatDate(member.assignedDate)}
                          </Text>
                        </View>
                        {member.lastSessionDate && (
                          <View style={styles.statRow}>
                            <Text style={styles.statRowLabel}>최근 세션</Text>
                            <Text style={styles.statRowValue}>
                              {formatDate(member.lastSessionDate)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.statRow}>
                          <Text style={styles.statRowLabel}>예정 세션</Text>
                          <Text style={styles.statRowValue}>
                            {member.upcomingSessions}회
                          </Text>
                        </View>
                        <View style={styles.statRow}>
                          <Text style={styles.statRowLabel}>총 세션</Text>
                          <Text style={styles.statRowValue}>
                            {member.totalSessions}회
                          </Text>
                        </View>

                        <View style={styles.memberActions}>
                          <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="calendar-outline" size={18} color="white" />
                            <Text style={styles.actionButtonText}>일정 보기</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="chatbubble-outline" size={18} color="white" />
                            <Text style={styles.actionButtonText}>메시지</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {otherMembers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>비활성 회원 ({otherMembers.length})</Text>
                {otherMembers.map((member) => (
                  <TouchableOpacity
                    key={member.memberId}
                    style={[
                      styles.memberCard,
                      styles.inactiveCard,
                      selectedMember === member.memberId && styles.selectedCard
                    ]}
                    onPress={() => setSelectedMember(
                      selectedMember === member.memberId ? null : member.memberId
                    )}
                    activeOpacity={0.8}
                  >
                    <View style={styles.memberHeader}>
                      <View style={styles.memberInfo}>
                        <View style={styles.profileIcon}>
                          <Ionicons name="person-circle" size={40} color="rgba(255,255,255,0.6)" />
                        </View>
                        <View style={styles.memberDetails}>
                          <Text style={[styles.memberName, styles.inactiveText]}>
                            {member.name}
                          </Text>
                          <Text style={[styles.memberPhone, styles.inactiveText]}>
                            {member.phoneNumber}
                          </Text>
                        </View>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusColor(member.scheduleStatus).bg,
                          borderColor: getStatusColor(member.scheduleStatus).border
                        }
                      ]}>
                        <Text style={styles.statusText}>
                          {getStatusText(member.scheduleStatus)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B82F6',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  memberCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selectedCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'white',
  },
  inactiveCard: {
    opacity: 0.7,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  profileIcon: {
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  memberPhone: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  inactiveText: {
    color: 'rgba(255,255,255,0.6)',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  memberStats: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statRowLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  statRowValue: {
    fontSize: 13,
    color: 'white',
    fontWeight: '500',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B99F7',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
