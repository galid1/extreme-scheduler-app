/**
 * Auth Initialization
 * 인증 관련 초기화 로직
 */

import { forceSetToken } from '@/src/utils/forceSetToken';

/**
 * 인증 초기화
 * - forceSetToken 실행 (테스트용)
 * - AsyncStorage에서 토큰 로드 (Zustand persist가 자동으로 처리)
 */
export async function initializeAuth(): Promise<void> {
  try {
    // 테스트용: 로그인/회원가입을 건너뛰고 싶은 경우 사용
    // await forceSetToken();
    console.log('[Auth] Initialization completed');
  } catch (error) {
    console.error('[Auth] Initialization failed:', error);
    throw error;
  }
}
