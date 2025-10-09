import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/store/useAuthStore';

export default function Index() {
  const { token, account } = useAuthStore();

  // Check if user has token or account data
  if (token || account) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/phone-auth" />;
}