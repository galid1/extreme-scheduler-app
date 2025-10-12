import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MemberTrainerAssignmentRequestDto } from '@/src/types/api';
import { RequestStatus } from '@/src/types/enums';
import { memberService } from '@/src/services/api';

interface MemberPendingAssignmentScreenProps {
  requests?: MemberTrainerAssignmentRequestDto[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function MemberPendingAssignmentScreen({
  requests,
  onRefresh,
  isRefreshing,
}: MemberPendingAssignmentScreenProps) {
  const [cancellingRequestId, setCancellingRequestId] = useState<number | null>(null);

  // 요청이 없으면 아무것도 표시하지 않음
  if (!requests || requests.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCancelRequest = async (request: MemberTrainerAssignmentRequestDto) => {
    Alert.alert(
      '요청 취소',
      `${request.trainerName} 트레이너에게 보낸 배정 요청을 취소하시겠습니까?`,
      [
        {
          text: '아니오',
          style: 'cancel',
        },
        {
          text: '취소',
          style: 'destructive',
          onPress: async () => {
            setCancellingRequestId(request.requestId);
            try {
              await memberService.cancelTrainerAssignmentRequest(request.requestId);
              Alert.alert('완료', '배정 요청이 취소되었습니다.');
              onRefresh();
            } catch (error) {
              console.error('Error cancelling request:', error);
              Alert.alert('오류', '요청 취소에 실패했습니다.');
            } finally {
              setCancellingRequestId(null);
            }
          },
        },
      ]
    );
  };

  // 대기 중인 요청과 거절된 요청 분리
  const pendingRequests = requests.filter(req => req.status === RequestStatus.PENDING);
  const rejectedRequests = requests.filter(req => req.status === RequestStatus.REJECTED);

  // 상태 플래그
  const isPending = pendingRequests.length > 0;
  const isRejected = rejectedRequests.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 헤더 */}
        <View style={styles.header}>
          {pendingRequests.length > 0 && <Ionicons name="time-outline" size={80} color="#3B82F6" />}
          {pendingRequests.length === 0 && rejectedRequests.length > 0 && (
            <Ionicons name="close-circle-outline" size={80} color="#EF4444" />
          )}

          <Text style={styles.title}>
            {pendingRequests.length > 0 && '트레이너 배정 대기중'}
            {pendingRequests.length === 0 && rejectedRequests.length > 0 && '트레이너 배정 거절됨'}
          </Text>

          <Text style={styles.message}>
            {pendingRequests.length > 0 && `트레이너의 승인을 기다리고 있습니다.\n승인되면 일정 등록이 가능합니다.`}
            {pendingRequests.length === 0 && rejectedRequests.length > 0 && `배정 요청이 거절되었습니다.\n다른 트레이너를 검색해보세요.`}
          </Text>
        </View>

        {/* 대기 중인 요청 목록 */}
        {pendingRequests.length > 0 && (
          <View style={styles.requestSection}>
            <Text style={styles.sectionTitle}>대기 중인 요청</Text>
            {pendingRequests.map((request) => (
              <View key={request.requestId} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.trainerInfo}>
                    <Ionicons name="person-circle" size={40} color="#3B82F6" />
                    <View style={styles.trainerDetails}>
                      <Text style={styles.trainerName}>{request.trainerName}</Text>
                      <Text style={styles.requestDate}>
                        요청일: {formatDate(request.requestedAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>대기중</Text>
                  </View>
                </View>

                {/* 취소 버튼 */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelRequest(request)}
                  disabled={cancellingRequestId === request.requestId}
                >
                  {cancellingRequestId === request.requestId ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <>
                      <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                      <Text style={styles.cancelButtonText}>요청 취소</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 거절된 요청 목록 */}
        {rejectedRequests.length > 0 && (
          <View style={styles.requestSection}>
            <Text style={styles.sectionTitle}>거절된 요청</Text>
            {rejectedRequests.map((request) => (
              <View key={request.requestId} style={[styles.requestCard, styles.rejectedCard]}>
                <View style={styles.requestHeader}>
                  <View style={styles.trainerInfo}>
                    <Ionicons name="person-circle" size={40} color="#EF4444" />
                    <View style={styles.trainerDetails}>
                      <Text style={styles.trainerName}>{request.trainerName}</Text>
                      <Text style={styles.requestDate}>
                        거절일: {request.processedAt ? formatDate(request.processedAt) : '-'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rejectedBadge}>
                    <Text style={styles.rejectedBadgeText}>거절됨</Text>
                  </View>
                </View>

                {/* 거절 사유 */}
                {request.rejectReason && (
                  <View style={styles.rejectReasonContainer}>
                    <Text style={styles.rejectReasonLabel}>거절 사유:</Text>
                    <Text style={styles.rejectReasonText}>{request.rejectReason}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={20} color="white" />
              <Text style={styles.refreshButtonText}>새로고침</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
          <Text style={styles.infoText}>
            {isPending && '배정 상태는 자동으로 업데이트됩니다.\n새로고침 버튼으로 최신 상태를 확인할 수 있습니다.'}
            {isRejected && '요청이 거절되었습니다.\n트레이너 검색으로 돌아가서 다른 트레이너를 찾아보세요.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  requestSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rejectedCard: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trainerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  trainerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  trainerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  statusBadgeText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectedBadge: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  rejectedBadgeText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectReasonContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
  },
  rejectReasonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  rejectReasonText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
});
