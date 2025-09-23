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

type TrainerAssignmentRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface TrainerAssignmentRequestDto {
  requestId: number;
  memberAccountId: string;
  memberName?: string;
  memberPhone?: string;
  status: TrainerAssignmentRequestStatus;
  requestedAt: string;
  processedAt?: string;
  rejectReason?: string;
}

export default function AssignmentRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<TrainerAssignmentRequestDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockRequests: TrainerAssignmentRequestDto[] = [
        {
          requestId: 1,
          memberAccountId: 'member_001',
          memberName: '김민수',
          memberPhone: '010-1234-5678',
          status: 'PENDING',
          requestedAt: new Date().toISOString(),
        },
        {
          requestId: 2,
          memberAccountId: 'member_002',
          memberName: '이영희',
          memberPhone: '010-2345-6789',
          status: 'PENDING',
          requestedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          requestId: 3,
          memberAccountId: 'member_003',
          memberName: '박철수',
          memberPhone: '010-3456-7890',
          status: 'PENDING',
          requestedAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          requestId: 4,
          memberAccountId: 'member_004',
          memberName: '정수진',
          memberPhone: '010-4567-8901',
          status: 'APPROVED',
          requestedAt: new Date(Date.now() - 86400000).toISOString(),
          processedAt: new Date(Date.now() - 43200000).toISOString(),
        },
        {
          requestId: 5,
          memberAccountId: 'member_005',
          memberName: '최동욱',
          memberPhone: '010-5678-9012',
          status: 'REJECTED',
          requestedAt: new Date(Date.now() - 172800000).toISOString(),
          processedAt: new Date(Date.now() - 86400000).toISOString(),
          rejectReason: '일정 불일치',
        },
      ];

      setRequests(mockRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (requestId: number, action: 'approve' | 'reject') => {
    setProcessingIds(prev => new Set([...prev, requestId]));

    try {
      // Mock API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 500));

      setRequests(prev =>
        prev.map(req =>
          req.requestId === requestId
            ? {
                ...req,
                status: action === 'approve' ? 'APPROVED' : 'REJECTED',
                processedAt: new Date().toISOString(),
                rejectReason: action === 'reject' ? '트레이너가 거절함' : undefined
              }
            : req
        )
      );
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}일 전`;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const processedRequests = requests.filter(r => r.status !== 'PENDING');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>담당 트레이너 요청</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>요청 목록을 불러오는 중...</Text>
          </View>
        ) : (
          <>
            {pendingRequests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>대기중 요청 ({pendingRequests.length})</Text>
                {pendingRequests.map((request) => (
                  <View key={request.requestId} style={styles.requestCard}>
                    <View style={styles.requestInfo}>
                      <View style={styles.profileIcon}>
                        <Ionicons name="person-circle" size={48} color="white" />
                      </View>
                      <View style={styles.requestDetails}>
                        <Text style={styles.memberName}>{request.memberName || '이름 없음'}</Text>
                        <Text style={styles.memberPhone}>{request.memberPhone || '번호 없음'}</Text>
                        <Text style={styles.requestTime}>{formatDate(request.requestedAt)} 요청</Text>
                      </View>
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.acceptButton, processingIds.has(request.requestId) && styles.buttonDisabled]}
                        onPress={() => handleAction(request.requestId, 'approve')}
                        disabled={processingIds.has(request.requestId)}
                      >
                        {processingIds.has(request.requestId) ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={18} color="white" />
                            <Text style={styles.acceptButtonText}>수락</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.rejectButton, processingIds.has(request.requestId) && styles.buttonDisabled]}
                        onPress={() => handleAction(request.requestId, 'reject')}
                        disabled={processingIds.has(request.requestId)}
                      >
                        {processingIds.has(request.requestId) ? (
                          <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
                        ) : (
                          <>
                            <Ionicons name="close" size={18} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.rejectButtonText}>거절</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {processedRequests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>처리된 요청</Text>
                {processedRequests.map((request) => (
                  <View key={request.requestId} style={[styles.requestCard, styles.processedCard]}>
                    <View style={styles.requestInfo}>
                      <View style={styles.profileIcon}>
                        <Ionicons name="person-circle" size={48} color="rgba(255,255,255,0.6)" />
                      </View>
                      <View style={styles.requestDetails}>
                        <Text style={[styles.memberName, styles.processedText]}>
                          {request.memberName || '이름 없음'}
                        </Text>
                        <Text style={[styles.memberPhone, styles.processedText]}>
                          {request.memberPhone || '번호 없음'}
                        </Text>
                        <Text style={[styles.requestTime, styles.processedText]}>
                          {formatDate(request.requestedAt)} 요청
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statusBadge}>
                      <View style={[
                        styles.statusIndicator,
                        request.status === 'APPROVED' ? styles.approvedIndicator : styles.rejectedIndicator
                      ]}>
                        <Ionicons
                          name={request.status === 'APPROVED' ? 'checkmark-circle' : 'close-circle'}
                          size={16}
                          color="white"
                        />
                        <Text style={styles.statusText}>
                          {request.status === 'APPROVED' ? '승인됨' : '거절됨'}
                        </Text>
                      </View>
                      {request.rejectReason && (
                        <Text style={styles.rejectReason}>{request.rejectReason}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {requests.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={60} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyText}>요청이 없습니다</Text>
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
  requestCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  processedCard: {
    opacity: 0.7,
  },
  requestInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  profileIcon: {
    marginRight: 12,
  },
  requestDetails: {
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
    marginBottom: 2,
  },
  requestTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  processedText: {
    color: 'rgba(255,255,255,0.6)',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5B99F7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 4,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  rejectButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  statusBadge: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  approvedIndicator: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  rejectedIndicator: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectReason: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: 12,
  },
});