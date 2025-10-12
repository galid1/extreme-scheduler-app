/**
 * Environment configuration
 * Expo 환경변수를 사용한 설정
 */

interface EnvironmentConfig {
  API_URL: string;
  ENV: string;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  // Expo 환경변수 사용 (EXPO_PUBLIC_ prefix 필요)
  // Expo 앱에서는 컴퓨터의 실제 IP 주소를 사용해야 합니다.
  // iOS Simulator에서도 localhost 대신 실제 IP를 사용하는 것이 안전합니다.

  // 개발 환경에서 사용할 로컬 서버 주소
  // 본인의 로컬 IP 주소로 변경하세요 (ifconfig 또는 ipconfig로 확인)
  // const defaultApiUrl = 'http://localhost:8080'; // ios simulator에서 테스트시
    const url = "http://172.30.1.85:8080" // device에서 테스트시

  // const apiUrl = process.env.EXPO_PUBLIC_API_URL || defaultApiUrl;
  const env = process.env.EXPO_PUBLIC_ENV || 'development';

  return {
    // API_URL: apiUrl,
      API_URL: url,
    ENV: env,
  };
};

export const config = getEnvironmentConfig();
export default config;
