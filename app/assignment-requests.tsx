import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { trainerService } from '@/src/services/api';
import { useAssignmentStore } from '@/src/store/useAssignmentStore';
import type { AssignmentRequestDto } from '@/src/types/api';

export default function AssignmentRequestsScreen() {
  const router = useRouter();
  const { assignmentRequests, setAssignmentRequests, isLoadingRequests, setIsLoadingRequests } = useAssignmentStore();
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const response = await trainerService.getAssignmentRequests();
      setAssignmentRequests(response.content);
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('오류', '요청 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleAction = async (requestId: number, action: 'approve' | 'reject') => {
    setProcessingIds(prev => new Set([...prev, requestId]));

    try {
      if (action === 'approve') {
        await trainerService.acceptAssignmentRequest(requestId);
        Alert.alert('성공', '회원 배정 요청을 수락했습니다.');
      } else {
        // You might want to show a dialog to get the reject reason
        const rejectReason = '트레이너 일정이 가득 참';
        await trainerService.rejectAssignmentRequest(requestId, rejectReason);
        Alert.alert('완료', '회원 배정 요청을 거절했습니다.');
      }

      // Refresh the list after action
      await fetchRequests();
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      Alert.alert('오류', '요청 처리 중 오류가 발생했습니다.');
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

  const pendingRequests = assignmentRequests.filter(r => r.status === 'PENDING');
  const processedRequests = assignmentRequests.filter(r => r.status !== 'PENDING');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>담당 트레이너 요청</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoadingRequests ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
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
                        <Ionicons name="person-circle" size={48} color="#3B82F6" />
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
                          <ActivityIndicator size="small" color="#6B7280" />
                        ) : (
                          <>
                            <Ionicons name="close" size={18} color="#6B7280" />
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
                        <Ionicons name="person-circle" size={48} color="#9CA3AF" />
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
                        request.status === 'ACCEPTED' ? styles.approvedIndicator : styles.rejectedIndicator
                      ]}>
                        <Ionicons
                          name={request.status === 'ACCEPTED' ? 'checkmark-circle' : 'close-circle'}
                          size={16}
                          color="#1F2937"
                        />
                        <Text style={styles.statusText}>
                          {request.status === 'ACCEPTED' ? '승인됨' : '거절됨'}
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

            {assignmentRequests.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={60} color="#D1D5DB" />
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
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
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
    color: '#6B7280',
    marginTop: 12,
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#1F2937',
    marginBottom: 2,
  },
  memberPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  requestTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  processedText: {
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
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
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rejectButtonText: {
    color: '#6B7280',
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
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectReason: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
  },
});