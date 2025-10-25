import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Switch,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    checkPushNotificationPermission,
    openAppSettings,
} from '@/src/utils/pushNotifications';

const NOTIFICATION_ENABLED_KEY = 'notification_enabled';

export default function NotificationSettingsScreen() {
    const router = useRouter();
    const [isEnabled, setIsEnabled] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            // 1. 사용자 설정 확인
            const savedValue = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
            const userEnabled = savedValue === null ? true : savedValue === 'true';

            // 2. 시스템 권한 확인
            const permission = await checkPushNotificationPermission();

            setIsEnabled(userEnabled);
            setHasPermission(permission);
        } catch (error) {
            console.error('[Notification Settings] Failed to load:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (value: boolean) => {
        // 권한이 없는 경우
        if (!hasPermission) {
            Alert.alert(
                '알림 권한 필요',
                '알림을 받으려면 설정에서 알림 권한을 허용해주세요.',
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '설정 열기',
                        onPress: async () => {
                            await openAppSettings();
                            // 설정에서 돌아온 후 권한 재확인
                            setTimeout(async () => {
                                const permission = await checkPushNotificationPermission();
                                setHasPermission(permission);
                                if (permission) {
                                    setIsEnabled(true);
                                    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');
                                }
                            }, 1000);
                        },
                    },
                ]
            );
            return;
        }

        // 권한이 있는 경우 토글
        try {
            setIsEnabled(value);
            await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, value.toString());

            if (value) {
                Alert.alert('알림 켜짐', '중요한 일정 알림을 받으실 수 있습니다.');
            } else {
                Alert.alert('알림 꺼짐', '알림을 받지 않습니다.');
            }
        } catch (error) {
            console.error('[Notification Settings] Failed to save:', error);
            Alert.alert('오류', '설정을 저장하는데 실패했습니다.');
        }
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
                    <Text style={styles.headerTitle}>알림 설정</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                {/* Permission Status */}
                {!hasPermission && (
                    <View style={styles.warningCard}>
                        <Ionicons name="warning" size={20} color="#F59E0B" />
                        <View style={styles.warningTextContainer}>
                            <Text style={styles.warningTitle}>알림 권한 없음</Text>
                            <Text style={styles.warningDescription}>
                                알림을 받으려면 설정에서 권한을 허용해주세요
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={openAppSettings}
                            style={styles.settingsButton}
                        >
                            <Text style={styles.settingsButtonText}>설정 열기</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Notification Toggle */}
                <View style={[styles.card, !hasPermission && styles.cardMarginTop]}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Ionicons
                                name="notifications"
                                size={24}
                                color={!hasPermission ? '#9CA3AF' : '#3B82F6'}
                            />
                            <View style={styles.settingTextContainer}>
                                <Text style={[
                                    styles.settingTitle,
                                    !hasPermission && styles.disabledText
                                ]}>
                                    푸시 알림
                                </Text>
                                <Text style={styles.settingDescription}>
                                    일정 변경, 요청 등의 알림을 받습니다
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isEnabled}
                            onValueChange={handleToggle}
                            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                            thumbColor={isEnabled ? '#3B82F6' : '#F3F4F6'}
                            disabled={isLoading || !hasPermission}
                        />
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
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    settingTextContainer: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 13,
        color: '#6B7280',
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
    cardMarginTop: {
        marginTop: 0,
    },
    disabledText: {
        color: '#9CA3AF',
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
    settingsButton: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    settingsButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: 'white',
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
    },
});
