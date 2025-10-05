import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorRetryViewProps {
  onRetry: () => void;
  isRetrying?: boolean;
  errorMessage?: string;
}

export default function ErrorRetryView({
  onRetry,
  isRetrying = false,
  errorMessage = '문제가 발생했습니다'
}: ErrorRetryViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.title}>{errorMessage}</Text>
        <Text style={styles.subtitle}>잠시 후 다시 시도해주세요</Text>

        <TouchableOpacity
          style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
          onPress={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.retryButtonText}>재시도 중...</Text>
            </>
          ) : (
            <>
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    minWidth: 140,
  },
  retryButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
