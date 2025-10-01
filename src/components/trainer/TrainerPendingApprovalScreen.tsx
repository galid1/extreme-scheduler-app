import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface TrainerPendingApprovalScreenProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function TrainerPendingApprovalScreen({
  onRefresh,
  isRefreshing,
}: TrainerPendingApprovalScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pendingContainer}>
        <View style={styles.pendingCard}>
          <Ionicons name="time-outline" size={80} color="#3B82F6" />
          <Text style={styles.pendingTitle}>관리자 승인 대기중</Text>
          <Text style={styles.pendingMessage}>
            트레이너 계정이 승인 대기 중입니다.{' '}
            관리자의 승인 후 서비스를 이용하실 수 있습니다.
          </Text>
          <Text style={styles.pendingSubMessage}>
            승인까지 보통 1-2일 정도 소요됩니다.
          </Text>

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

          <View style={styles.pendingInfoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
            <Text style={styles.pendingInfoText}>
              승인 상태는 자동으로 업데이트됩니다.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pendingCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 400,
    width: '100%',
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  pendingMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
    fontWeight: '500',
  },
  pendingSubMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
    minWidth: 140,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  pendingInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  pendingInfoText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
});
