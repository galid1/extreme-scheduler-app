import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useAuthStore} from '@/src/store/useAuthStore';
import {AccountType} from '@/src/types/enums';
import {useRouter} from "expo-router";

export default function ProfileScreen() {
    const router = useRouter();
    const {account, logout} = useAuthStore();

    // 전화번호 포맷팅 함수 (010-1234-5678 형식)
    const formatPhoneNumber = (phone: string) => {
        // 이미 '-'가 포함되어 있으면 그대로 반환
        if (phone.includes('-')) {
            return phone;
        }

        // 숫자만 추출
        const numbers = phone.replace(/[^0-9]/g, '');

        // 010-1234-5678 형식으로 변환
        if (numbers.length === 11) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
        }

        // 10자리인 경우 (02 등 지역번호)
        if (numbers.length === 10) {
            return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
        }

        // 그 외의 경우 원본 반환
        return phone;
    };

    const handleLogout = async () => {
        await logout();

        // 로그아웃 후 store 상태 다시 확인
        const authStore = useAuthStore.getState();
        console.log(`Account after logout: ${JSON.stringify(authStore.account)}`)
        console.log(`Token after logout: ${JSON.stringify(authStore.token)}`)

        router.replace('/(auth)/phone-auth');
    };

    if (!account) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centered}>
                    <Text style={styles.noAccountText}>로그인 정보가 없습니다</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topHeader}>
                <Text style={styles.topHeaderText}>내 프로필</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person-circle" size={80} color="#3B82F6"/>
                    </View>
                    <Text style={styles.name}>{account.privacyInfo.name}</Text>
                    <Text style={styles.accountType}>
                        {account.accountType === AccountType.TRAINER ? '트레이너' : '회원'}
                    </Text>
                </View>

                {/* Profile Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>기본 정보</Text>

                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={20} color="#6B7280"/>
                        <Text style={styles.infoLabel}>전화번호</Text>
                        <Text style={styles.infoValue}>{formatPhoneNumber(account.privacyInfo.phoneNumber)}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={20} color="#6B7280"/>
                        <Text style={styles.infoLabel}>생년월일</Text>
                        <Text style={styles.infoValue}>{account.privacyInfo.birthDate}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={20} color="#6B7280"/>
                        <Text style={styles.infoLabel}>성별</Text>
                        <Text style={styles.infoValue}>
                            {account.privacyInfo.gender === 'MALE' ? '남성' : '여성'}
                        </Text>
                    </View>
                </View>

                {/* Logout Button */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={styles.logoutButton}
                    >
                        <Ionicons name="log-out-outline" size={20} color="white"/>
                        <Text style={styles.logoutText}>로그아웃</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noAccountText: {
        fontSize: 16,
        color: '#6B7280',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 32,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    topHeaderText: {
        fontSize: 22,
        color: '#333',
        fontWeight: '700',
        marginBottom: 8,
    },
    avatarContainer: {
        marginBottom: 8,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    accountType: {
        fontSize: 14,
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    section: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 12,
    },
    menuText: {
        flex: 1,
        fontSize: 15,
        color: '#1F2937',
    },
    logoutSection: {
        padding: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: 'white',
    },

});
