import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/useAuthStore';

interface Member {
  id: string;
  name: string;
  phoneNumber: string;
  scheduleStatus: 'READY' | 'NOT_READY';
  registeredTimes?: number;
  lastScheduleUpdate?: string;
}

export default function AutoSchedulingScreen() {
  const router = useRouter();
  const { setScheduleStatus } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (isProcessing) {
      // Start rotation animation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isProcessing]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockMembers: Member[] = [
        {
          id: 'member_001',
          name: '김민수',
          phoneNumber: '010-1234-5678',
          scheduleStatus: 'READY',
          registeredTimes: 8,
          lastScheduleUpdate: '2024-01-15',
        },
        {
          id: 'member_002',
          name: '이영희',
          phoneNumber: '010-2345-6789',
          scheduleStatus: 'READY',
          registeredTimes: 12,
          lastScheduleUpdate: '2024-01-14',
        },
        {
          id: 'member_003',
          name: '박철수',
          phoneNumber: '010-3456-7890',
          scheduleStatus: 'NOT_READY',
        },
        {
          id: 'member_004',
          name: '정미영',
          phoneNumber: '010-4567-8901',
          scheduleStatus: 'READY',
          registeredTimes: 6,
          lastScheduleUpdate: '2024-01-13',
        },
        {
          id: 'member_005',
          name: '최준호',
          phoneNumber: '010-5678-9012',
          scheduleStatus: 'NOT_READY',
        },
        {
          id: 'member_006',
          name: '강서연',
          phoneNumber: '010-6789-0123',
          scheduleStatus: 'READY',
          registeredTimes: 10,
          lastScheduleUpdate: '2024-01-16',
        },
      ];

      // Sort by status: READY first, then NOT_READY
      const sortedMembers = mockMembers.sort((a, b) => {
        if (a.scheduleStatus === 'READY' && b.scheduleStatus === 'NOT_READY') return -1;
        if (a.scheduleStatus === 'NOT_READY' && b.scheduleStatus === 'READY') return 1;
        return 0;
      });

      setMembers(sortedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAutoSchedule = async () => {
    setIsProcessing(true);

    // Simulate server processing
    await new Promise(resolve => setTimeout(resolve, 1700));

    // Update schedule status to SCHEDULED
    setScheduleStatus('SCHEDULED');

    setShowConfirmButton(true);
    setIsProcessing(false);
  };

  const handleConfirmSchedule = () => {
    // Navigate to training schedule view
    router.push('/training-schedule');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>회원 목록을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isProcessing || showConfirmButton) {
    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.processingContainer}>
          <Animated.View
            style={[
              styles.processingContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {!showConfirmButton ? (
              <>
                <Animated.View
                  style={{
                    transform: [{ rotate: spin }],
                  }}
                >
                  <Ionicons name="sync" size={64} color="#3B82F6" />
                </Animated.View>
                <Text style={styles.processingTitle}>자동 스케줄링 중...</Text>
                <Text style={styles.processingSubtitle}>
                  {selectedMemberIds.length}명의 회원 일정을 최적화하고 있습니다
                </Text>
                <ActivityIndicator
                  size="large"
                  color="#666"
                  style={{ marginTop: 20 }}
                />
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={80} color="#4ADE80" />
                <Text style={styles.successTitle}>스케줄링 완료!</Text>
                <Text style={styles.successSubtitle}>
                  총 {selectedMemberIds.length}명의 회원 일정이 생성되었습니다
                </Text>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmSchedule}
                >
                  <Text style={styles.confirmButtonText}>스케줄 확인</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.title}>자동 스케줄링</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>
          일정을 등록한 회원들을 선택하여 자동으로 스케줄을 생성합니다
        </Text>
      </View>

      <ScrollView
        style={styles.membersList}
        contentContainerStyle={styles.membersListContent}
        showsVerticalScrollIndicator={false}
      >
        {members.map((member) => {
          const isReady = member.scheduleStatus === 'READY';
          const isSelected = selectedMemberIds.includes(member.id);

          return (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.memberCard,
                !isReady && styles.memberCardDisabled,
                isSelected && styles.memberCardSelected,
              ]}
              onPress={() => isReady && toggleMemberSelection(member.id)}
              disabled={!isReady}
              activeOpacity={0.8}
            >
              <View style={styles.memberCardHeader}>
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={[
                      styles.memberName,
                      !isReady && styles.memberNameDisabled,
                    ]}>
                      {member.name}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      !isReady && styles.statusBadgeNotReady,
                    ]}>
                      <Text style={styles.statusText}>
                        {isReady ? 'READY' : 'NOT READY'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.memberPhone,
                    !isReady && styles.memberPhoneDisabled,
                  ]}>
                    {member.phoneNumber}
                  </Text>
                  {isReady && member.registeredTimes && (
                    <View style={styles.memberMetaInfo}>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color="#666" />
                        <Text style={styles.metaText}>
                          {member.registeredTimes}개 시간대
                        </Text>
                      </View>
                      {member.lastScheduleUpdate && (
                        <View style={styles.metaItem}>
                          <Ionicons name="calendar-outline" size={14} color="#666" />
                          <Text style={styles.metaText}>
                            {member.lastScheduleUpdate}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <View style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected,
                  !isReady && styles.checkboxDisabled,
                ]}>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color="white" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        {selectedMemberIds.length > 0 && (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedCount}>
              {selectedMemberIds.length}명 선택됨
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.proceedButton,
            selectedMemberIds.length === 0 && styles.proceedButtonDisabled,
          ]}
          onPress={handleAutoSchedule}
          disabled={selectedMemberIds.length === 0}
        >
          <Text style={[
            styles.proceedButtonText,
            selectedMemberIds.length === 0 && styles.proceedButtonTextDisabled,
          ]}>자동 스케줄링 시작</Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={selectedMemberIds.length === 0 ? "#999" : "white"}
          />
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
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  membersList: {
    flex: 1,
  },
  membersListContent: {
    padding: 16,
  },
  memberCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  memberCardDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E0E0E0',
    opacity: 0.6,
  },
  memberCardSelected: {
    backgroundColor: '#E8F2FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  memberCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  memberNameDisabled: {
    color: '#999',
  },
  statusBadge: {
    backgroundColor: '#E8F2FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  statusBadgeNotReady: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E0E0E0',
  },
  statusText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
  },
  memberPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  memberPhoneDisabled: {
    color: '#999',
  },
  memberMetaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxDisabled: {
    borderColor: '#E0E0E0',
    backgroundColor: '#F3F4F6',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  selectedInfo: {
    marginBottom: 12,
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  proceedButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  proceedButtonDisabled: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6,
  },
  proceedButtonTextDisabled: {
    color: '#999',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  processingContent: {
    alignItems: 'center',
  },
  processingTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
    marginTop: 30,
    marginBottom: 12,
  },
  processingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
});