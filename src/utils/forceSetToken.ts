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

    // 2. Store 상태 완전 초기화 (account 데이터도 클리어)
    const store = useAuthStore.getState();
    store.setAccountData = (data) => {
      useAuthStore.setState({
        account: data.account,
        trainer: data.trainer || null,
        member: data.member || null,
      });
    };

    // 모든 상태 초기화
    useAuthStore.setState({
      token: null,
      phoneNumber: null,
      tempToken: null,
      account: null,
      trainer: null,
      member: null,
      assignedTrainer: null,
      autoSchedulingResults: null,
      weeklyScheduleRegistration: null,
    });

    // 3. 새 토큰만 설정
    // store.setToken("c31a080a-b7a9-47d9-9c5a-8b4125816ac2"); // trainer
    store.setToken("76a0af7c-8702-4d00-b50a-f3a5507a12ad"); // member

    // 4. Store 상태 확인
    const newState = useAuthStore.getState();
    console.log('New store state after forceSetToken:', {
      token: newState.token,
      account: newState.account,
    });

    return true;
  } catch (error) {
    console.error('Failed to force set token:', error);
    return false;
  }
};
