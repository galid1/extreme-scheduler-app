/**
 * 테스트용 토큰 설정 유틸리티
 * AsyncStorage에 직접 토큰을 설정합니다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const setTestToken = async () => {
  const testAuthState = {
    state: {
      token: "c31a080a-b7a9-47d9-9c5a-8b4125816ac2",
      isAuthenticated: true,
      phoneNumber: "010-1234-5678",
      name: "테스트 사용자",
      accountType: 'TRAINER',
      accountId: 1,
      account: null,
      trainer: null,
      member: null,
      trainerAccountId: null,
      savedSchedule: {},
      notificationSent: false,
    },
    version: 0
  };

  try {
    await AsyncStorage.setItem('auth-storage', JSON.stringify(testAuthState));
    return true;
  } catch (error) {
    console.error('Failed to set test token:', error);
    return false;
  }
};

export const clearAuthStorage = async () => {
  try {
    await AsyncStorage.removeItem('auth-storage');
    return true;
  } catch (error) {
    console.error('Failed to clear auth storage:', error);
    return false;
  }
};
