import { Link, Stack, useRouter } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';

export default function NotFoundScreen() {
  const router = useRouter();

  useEffect(() => {
    // Google OAuth 콜백 URL인 경우 자동으로 처리
    const handleInitialURL = async () => {
      const url = await Linking.getInitialURL();
      console.log('[NotFound] Initial URL:', url);

      if (url?.includes('oauth2redirect')) {
        console.log('[NotFound] Google OAuth callback detected, letting SDK handle it');
        // Google Sign-In SDK가 자동으로 처리하도록 함
        // 이 화면은 보이지 않고 바로 닫힘
      } else if (url === null || url === 'extremeschedulerapp://') {
        // Naver 로그아웃 등으로 인한 잘못된 라우팅인 경우
        // 캘린더 설정 화면으로 복귀
        console.log('[NotFound] Redirecting back to calendar-sync-settings');
        setTimeout(() => {
          router.replace('/calendar-sync-settings');
        }, 100);
      }
    };

    handleInitialURL();
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
