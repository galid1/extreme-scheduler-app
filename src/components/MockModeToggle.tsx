import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfigStore } from '@/src/store/useConfigStore';
import { useAuthStore } from '@/src/store/useAuthStore';
import { AccountType } from '@/src/types/enums';

export default function MockModeToggle() {
  const {
    environment,
    mockMode,
    mockRole,
    enableMockMode,
    disableMockMode,
    switchMockRole,
    getIsLocalEnvironment
  } = useConfigStore();
  const { account } = useAuthStore();

  // Only show in local environment
  if (!getIsLocalEnvironment()) {
    return null;
  }

  const handleToggle = async () => {
    if (!mockMode) {
      // Turning ON mock mode - ask for role
      Alert.alert(
        'Mock 모드 활성화',
        '테스트할 역할을 선택하세요',
        [
          {
            text: '트레이너',
            onPress: async () => {
              await enableMockMode('trainer');
              Alert.alert('Mock 모드', '트레이너 mock 데이터가 로드되었습니다.');
            }
          },
          {
            text: '회원',
            onPress: async () => {
              await enableMockMode('member');
              Alert.alert('Mock 모드', '회원 mock 데이터가 로드되었습니다.');
            }
          },
          {
            text: '취소',
            style: 'cancel'
          }
        ]
      );
    } else {
      // Turning OFF mock mode
      Alert.alert(
        'Mock 모드 해제',
        'Mock 모드를 해제하시겠습니까?',
        [
          {
            text: '해제',
            onPress: () => {
              disableMockMode();
              Alert.alert('Mock 모드', '실제 API를 사용합니다.');
            }
          },
          {
            text: '취소',
            style: 'cancel'
          }
        ]
      );
    }
  };

  const handleRoleSwitch = () => {
    if (!mockMode || !mockRole) return;

    const newRole = mockRole === 'trainer' ? 'member' : 'trainer';
    const roleName = newRole === 'trainer' ? '트레이너' : '회원';

    Alert.alert(
      '역할 전환',
      `${roleName}로 전환하시겠습니까?`,
      [
        {
          text: '전환',
          onPress: async () => {
            await switchMockRole(newRole);
            Alert.alert('역할 전환', `${roleName} mock 데이터가 로드되었습니다.`);
          }
        },
        {
          text: '취소',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name="flask"
          size={20}
          color={mockMode ? '#3B82F6' : '#6B7280'}
        />
        <Text style={[styles.label, mockMode && styles.labelActive]}>
          Mock Mode
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.environment}>환경: {environment}</Text>
        {mockMode && mockRole && (
          <TouchableOpacity onPress={handleRoleSwitch}>
            <Text style={styles.role}>
              역할: {mockRole === 'trainer' ? '트레이너' : '회원'}
              <Text style={styles.switchHint}> (전환)</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Switch
        value={mockMode}
        onValueChange={handleToggle}
        trackColor={{ false: '#E0E0E0', true: '#3B82F6' }}
        thumbColor={mockMode ? '#FFFFFF' : '#F4F4F4'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  labelActive: {
    color: '#3B82F6',
  },
  info: {
    marginRight: 12,
  },
  environment: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  role: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  switchHint: {
    fontSize: 10,
    color: '#60A5FA',
    fontStyle: 'italic',
  },
});