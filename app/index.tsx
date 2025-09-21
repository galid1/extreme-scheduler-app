import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/store/useAuthStore';

export default function Index() {
  const { checkAuth } = useAuthStore();
  const isAuthenticated = checkAuth();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/phone-auth" />;
}