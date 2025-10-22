/**
 * Environment configuration
 * Expo 환경변수를 사용한 설정
 */

interface EnvironmentConfig {
  API_URL: string;
  ENV: string;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
    const url = process.env.EXPO_PUBLIC_API_URL || "http://172.30.1.30:8080"  // local
    const env = process.env.EXPO_PUBLIC_ENV || 'production';

  return {
    API_URL: url,
    ENV: env,
  };
};

export const config = getEnvironmentConfig();
export default config;
