import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Switch,
    TouchableOpacity,
    Alert,
    Platform,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import {
    configureGoogleSignIn,
    signInWithGoogle,
    sendTokensToServer as sendGoogleTokensToServer,
    signOutFromGoogle,
    disconnectFromServer as disconnectGoogleFromServer,
} from '@/src/services/googleCalendar';
import {
    configureNaverLogin,
    signInWithNaver,
    sendTokensToServer as sendNaverTokensToServer,
    signOutFromNaver,
    disconnectFromServer as disconnectNaverFromServer,
    deleteNaverToken,
} from '@/src/services/naverCalendar';
import calendarIntegrationService from '@/src/services/api/calendar-integration.service';
import { CalendarPlatformType } from '@/src/types/enums';
// TODO: expo-calendar는 네이티브 빌드 후 활성화
// import * as Calendar from 'expo-calendar';

type CalendarPlatform = 'native' | 'google' | 'naver';

interface CalendarSyncState {
    native: boolean;
    google: boolean;
    naver: boolean;
}

export default function CalendarSyncSettingsScreen() {
    const router = useRouter();
    const [syncState, setSyncState] = useState<CalendarSyncState>({
        native: false,
        google: false,
        naver: false,
    });
    const [hasCalendarPermission, setHasCalendarPermission] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Google Sign-In 설정
        configureGoogleSignIn();
        // Naver Login 설정
        configureNaverLogin();
        loadSettings();
    }, []);

    /**
     * 서버에서 캘린더 연동 상태 불러오기 (내부 함수)
     */
    const fetchCalendarState = async () => {
        const response = await calendarIntegrationService.getActiveCalendarIntegrations();

        if (response.integration && response.integration.active) {
            // 연동된 캘린더가 있는 경우
            const platform = response.integration.calendarPlatformType;
            setSyncState({
                native: false,
                google: platform === CalendarPlatformType.GOOGLE_CALENDAR,
                naver: platform === CalendarPlatformType.NAVER_CALENDAR,
            });
        } else {
            // 연동된 캘린더가 없는 경우
            setSyncState({
                native: false,
                google: false,
                naver: false,
            });
        }

        // 캘린더 권한 확인 (TODO: expo-calendar 활성화 후 주석 해제)
        // const { status } = await Calendar.getCalendarPermissionsAsync();
        // setHasCalendarPermission(status === 'granted');
        setHasCalendarPermission(false); // 임시로 false
    };

    /**
     * 초기 로딩 시 설정 불러오기
     */
    const loadSettings = async () => {
        try {
            setIsLoading(true);
            await fetchCalendarState();
        } catch (error) {
            console.error('[Calendar Sync] Failed to load settings:', error);
            // 에러 발생 시 기본값 설정
            setSyncState({
                native: false,
                google: false,
                naver: false,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const requestCalendarPermission = async () => {
        // TODO: expo-calendar 활성화 후 주석 해제
        // const { status } = await Calendar.requestCalendarPermissionsAsync();
        // setHasCalendarPermission(status === 'granted');
        // if (status === 'granted') {
        //     Alert.alert('권한 허용됨', '이제 캘린더 연동을 사용할 수 있습니다.');
        // } else {
        //     Alert.alert('권한 거부됨', '캘린더 연동을 위해서는 권한이 필요합니다.');
        // }

        Alert.alert('준비 중', '캘린더 연동 기능은 네이티브 빌드 후 사용 가능합니다.');
    };

    const handleToggle = async (platform: CalendarPlatform, value: boolean) => {
        // 기본 캘린더는 권한 체크
        if (platform === 'native' && !hasCalendarPermission) {
            Alert.alert(
                '캘린더 권한 필요',
                '기본 캘린더 연동을 위해서는 권한이 필요합니다.',
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '권한 요청',
                        onPress: requestCalendarPermission,
                    },
                ]
            );
            return;
        }

        // Google 캘린더 연동/해제
        if (platform === 'google') {
            if (value) {
                // Google 연동 활성화
                await handleGoogleCalendarConnect();
            } else {
                // Google 연동 해제
                await handleGoogleCalendarDisconnect();
            }
            return;
        }

        // Naver 캘린더
        if (platform === 'naver') {
            if (value) {
                // Naver 연동 활성화
                await handleNaverCalendarConnect();
            } else {
                // Naver 연동 해제
                await handleNaverCalendarDisconnect();
            }
            return;
        }

        // 네이티브 캘린더 (기본)
        try {
            // 상태 업데이트
            const newState = { ...syncState, [platform]: value };
            setSyncState(newState);

            if (value) {
                Alert.alert('연동 활성화', `${getPlatformName(platform)} 연동이 활성화되었습니다.`);
            } else {
                Alert.alert('연동 비활성화', `${getPlatformName(platform)} 연동이 비활성화되었습니다.`);
            }
        } catch (error) {
            console.error('[Calendar Sync] Failed to save:', error);
            Alert.alert('오류', '설정을 저장하는데 실패했습니다.');
        }
    };

    /**
     * Google Calendar 연동
     */
    const handleGoogleCalendarConnect = async () => {
        try {
            setIsLoading(true);

            // 0. 다른 캘린더가 연동되어 있으면 먼저 해제
            if (syncState.naver) {
                await handleCalendarDisconnect('naver');
            }

            // 1. Google 로그인 및 토큰 획득
            const authorizationCode = await signInWithGoogle();
            // 2. 서버로 토큰 전송
            await sendGoogleTokensToServer(authorizationCode.authorizationCode);

            // 3. 서버에서 최신 상태 다시 가져오기 (Single Source of Truth)
            await fetchCalendarState();

            Alert.alert('연동 완료', 'Google 캘린더 연동이 완료되었습니다.');
        } catch (error: any) {
            console.error('[Google Calendar] Connection failed:', error);

            if (error.code === 'SIGN_IN_CANCELLED') {
                Alert.alert('취소됨', 'Google 로그인이 취소되었습니다.');
            } else {
                Alert.alert('연동 실패', 'Google 캘린더 연동에 실패했습니다. 다시 시도해주세요.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Naver Calendar 연동
     */
    const handleNaverCalendarConnect = async () => {
        try {
            setIsLoading(true);

            // 0. 다른 캘린더가 연동되어 있으면 먼저 해제
            if (syncState.google) {
                await handleCalendarDisconnect('google');
            }

            // 1. Naver 로그인 및 토큰 획득
            const { accessToken, refreshToken } = await signInWithNaver();
            console.log('[Naver Calendar] Login successful');

            // 2. 서버로 토큰 전송
            await sendNaverTokensToServer(accessToken, refreshToken);

            // 3. 서버에서 최신 상태 다시 가져오기 (Single Source of Truth)
            await fetchCalendarState();

            Alert.alert('연동 완료', 'Naver 캘린더 연동이 완료되었습니다.');
        } catch (error: any) {
            console.error('[Naver Calendar] Connection failed:', error);

            if (error.code === 'USER_CANCEL') {
                Alert.alert('취소됨', 'Naver 로그인이 취소되었습니다.');
            } else {
                Alert.alert('연동 실패', 'Naver 캘린더 연동에 실패했습니다. 다시 시도해주세요.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 캘린더 연동 해제 (공통 함수)
     */
    const handleCalendarDisconnect = async (platform: 'google' | 'naver') => {
        try {
            if (platform === 'google') {
                // 1. 서버에서 연동 해제
                await disconnectGoogleFromServer();
                // 2. Google Sign-Out
                await signOutFromGoogle();
            } else if (platform === 'naver') {
                // 1. 서버에서 연동 해제
                await disconnectNaverFromServer();
                // 2. Naver Sign-Out
                await signOutFromNaver();
                // 3. Naver Token 삭제
                await deleteNaverToken();
            }

            // 3. 서버에서 최신 상태 다시 가져오기 (Single Source of Truth)
            await fetchCalendarState();
        } catch (error) {
            console.error(`[${platform} Calendar] Disconnection failed:`, error);
            throw error;
        }
    };

    /**
     * Google Calendar 연동 해제
     */
    const handleGoogleCalendarDisconnect = async () => {
        Alert.alert(
            'Google 캘린더 연동 해제',
            '정말로 Google 캘린더 연동을 해제하시겠습니까?\n\n향후 자동 스케줄링 시 Google 캘린더에 일정이 추가되지 않습니다.',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '연동 해제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await handleCalendarDisconnect('google');
                            Alert.alert('연동 해제됨', 'Google 캘린더 연동이 해제되었습니다.');
                        } catch (error) {
                            console.error('[Google Calendar] Disconnection failed:', error);
                            Alert.alert('오류', '연동 해제에 실패했습니다.');
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    };

    /**
     * Naver Calendar 연동 해제
     */
    const handleNaverCalendarDisconnect = async () => {
        Alert.alert(
            'Naver 캘린더 연동 해제',
            '정말로 Naver 캘린더 연동을 해제하시겠습니까?\n\n향후 자동 스케줄링 시 Naver 캘린더에 일정이 추가되지 않습니다.',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '연동 해제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await handleCalendarDisconnect('naver');
                            Alert.alert('연동 해제됨', 'Naver 캘린더 연동이 해제되었습니다.');
                        } catch (error) {
                            console.error('[Naver Calendar] Disconnection failed:', error);
                            Alert.alert('오류', '연동 해제에 실패했습니다.');
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const getPlatformName = (platform: CalendarPlatform): string => {
        switch (platform) {
            case 'native':
                return Platform.OS === 'ios' ? 'iOS 캘린더' : 'Android 캘린더';
            case 'google':
                return 'Google 캘린더';
            case 'naver':
                return 'Naver 캘린더';
            default:
                return '';
        }
    };

    const renderCalendarItem = (
        platform: CalendarPlatform,
        iconName: string,
        isEnabled: boolean,
        requiresPermission: boolean = false
    ) => {
        const disabled = requiresPermission && !hasCalendarPermission;

        return (
            <View key={platform}>
                <View style={styles.calendarItem}>
                    <View style={styles.calendarLeft}>
                        {/* Placeholder 아이콘 - 추후 asset 이미지로 교체 */}
                        <View style={[styles.iconPlaceholder, disabled && styles.iconDisabled]}>
                            {platform === 'naver' ? (
                                <Image
                                    source={require('@/assets/images/calendar/naver_btn_square.png')}
                                    style={{ width: 40, height: 40 }}
                                    resizeMode="cover"
                                />
                            ) : platform === 'google' ? (
                                <Image
                                    source={require('@/assets/images/calendar/google_btn.png')}
                                    style={{ width: 40, height: 40 }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Ionicons
                                    name={iconName as any}
                                    size={24}
                                    color={disabled ? '#9CA3AF' : '#3B82F6'}
                                />
                            )}
                        </View>
                        <View style={styles.calendarTextContainer}>
                            <Text style={[styles.calendarTitle, disabled && styles.disabledText]}>
                                {getPlatformName(platform)}
                            </Text>
                            <Text style={styles.calendarDescription}>
                                {requiresPermission && !hasCalendarPermission
                                    ? '권한이 필요합니다'
                                    : '자동으로 일정을 동기화합니다'}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={isEnabled}
                        onValueChange={(value) => handleToggle(platform, value)}
                        trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                        thumbColor={isEnabled ? '#3B82F6' : '#F3F4F6'}
                        disabled={isLoading || disabled}
                    />
                </View>

                {/* 네이티브 캘린더 권한 경고 */}
                {platform === 'native' && !hasCalendarPermission && (
                    <View style={styles.warningCardInline}>
                        <Ionicons name="warning" size={18} color="#F59E0B" />
                        <View style={styles.warningTextContainer}>
                            <Text style={styles.warningTitle}>
                                {Platform.OS === 'ios' ? 'iOS' : 'Android'} 캘린더 권한 필요
                            </Text>
                            <Text style={styles.warningDescription}>
                                위의 {Platform.OS === 'ios' ? 'iOS' : 'Android'} 캘린더를 연동하려면 권한을 허용해주세요
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={requestCalendarPermission}
                            style={styles.permissionButton}
                        >
                            <Text style={styles.permissionButtonText}>권한 요청</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>캘린더 연동 설정</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* 캘린더 연동 목록 */}
                    <View style={styles.card}>
                        {/* iOS/Android 기본 캘린더 (플랫폼에 따라 하나만 표시) */}
                        {renderCalendarItem(
                            'native',
                            Platform.OS === 'ios' ? 'calendar' : 'calendar',
                            syncState.native,
                            true
                        )}

                        <View style={styles.divider} />

                        {/* Google 캘린더 */}
                        {renderCalendarItem('google', 'logo-google', syncState.google)}

                        <View style={styles.divider} />

                        {/* Naver 캘린더 */}
                        {renderCalendarItem('naver', 'globe-outline', syncState.naver)}
                    </View>

                    {/* 안내 */}
                    <View style={styles.infoSection}>
                        <Text style={styles.infoTitle}>캘린더 연동 안내</Text>
                        <View style={styles.infoItem}>
                            <Ionicons name="checkmark-circle" size={18} color="#6B7280" />
                            <Text style={styles.infoText}>
                                자동 스케줄링된 일정이 자동으로 동기화됩니다
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="sync" size={18} color="#6B7280" />
                            <Text style={styles.infoText}>
                                일정 변경시 연동된 캘린더에도 반영됩니다
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="shield-checkmark" size={18} color="#6B7280" />
                            <Text style={styles.infoText}>
                                언제든지 연동을 해제할 수 있습니다
                            </Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    placeholder: {
        width: 32,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    warningCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    warningTextContainer: {
        flex: 1,
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400E',
        marginBottom: 2,
    },
    warningDescription: {
        fontSize: 12,
        color: '#B45309',
    },
    permissionButton: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    permissionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: 'white',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 16,
    },
    calendarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    calendarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconDisabled: {
        opacity: 0.5,
    },
    calendarTextContainer: {
        flex: 1,
    },
    calendarTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    calendarDescription: {
        fontSize: 13,
        color: '#6B7280',
    },
    disabledText: {
        color: '#9CA3AF',
    },
    infoSection: {
        marginTop: 24,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    warningCardInline: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
});
