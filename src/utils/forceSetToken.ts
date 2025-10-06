/**
 * 강제로 토큰을 설정하는 유틸리티
 * AsyncStorage를 초기화하고 테스트 토큰을 설정합니다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/src/store/useAuthStore';

export const forceSetToken = async () => {
  try {
    // 1. AsyncStorage 완전 초기화
    await AsyncStorage.removeItem('auth-storage');
    console.log('AsyncStorage cleared');

    // 2. Store 상태 직접 업데이트
    const store = useAuthStore.getState();
    // store.setToken("c31a080a-b7a9-47d9-9c5a-8b4125816ac2"); // trainer
    store.setToken("76a0af7c-8702-4d00-b50a-f3a5507a12ad"); // member

    // 4. Store 상태 확인
    const newState = useAuthStore.getState();
    console.log('New store state:', {
      token: newState.token,
    });

    return true;
  } catch (error) {
    console.error('Failed to force set token:', error);
    return false;
  }
};
