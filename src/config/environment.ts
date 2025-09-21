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
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';
  const env = process.env.EXPO_PUBLIC_ENV || 'development';

  return {
    API_URL: apiUrl,
    ENV: env,
  };
};

export const config = getEnvironmentConfig();
export default config;