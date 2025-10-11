import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Alert,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { memberTrainerNoticeService } from '@/src/services/api';
import { TrainerNoticeResponse } from '@/src/types/api';

export default function MemberNoticesScreen() {
    const router = useRouter();
    const [notices, setNotices] = useState<TrainerNoticeResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);
    const [trainerAccountId, setTrainerAccountId] = useState<number | null>(null);

    // 화면 포커스될 때마다 백그라운드 새로고침
    useFocusEffect(
        React.useCallback(() => {
            fetchNotices(isLoading);
        }, [])
    );

    const fetchNotices = async (showLoading = false) => {
        if (showLoading) {
            setIsLoading(true);
        }
        try {
            const response = await memberTrainerNoticeService.getTrainerNotices(undefined, 0, 50);
            setNotices(response.notices);
            setTrainerAccountId(response.trainerAccountId);
        } catch (error) {
            console.error('Error fetching notices:', error);
            Alert.alert('오류', '공지사항을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchNotices();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    };

    // 고정 공지와 일반 공지 분리
    const fixedNotices = notices.filter(notice => notice.fixed);
    const regularNotices = notices.filter(notice => !notice.fixed);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>트레이너 공지사항</Text>
                    <View style={styles.headerSpacer} />
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>공지사항을 불러오는 중...</Text>
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                            />
                        }
                    >
                        {/* Fixed Notices */}
                        {fixedNotices.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="pin" size={20} color="#3B82F6" />
                                    <Text style={styles.sectionTitle}>상단 고정 공지</Text>
                                </View>
                                {fixedNotices.map((notice) => (
                                    <TouchableOpacity
                                        key={notice.noticeId}
                                        style={[
                                            styles.noticeCard,
                                            styles.fixedNoticeCard,
                                            selectedNoticeId === notice.noticeId && styles.selectedCard
                                        ]}
                                        onPress={() => setSelectedNoticeId(
                                            selectedNoticeId === notice.noticeId ? null : notice.noticeId
                                        )}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.noticeTitleRow}>
                                            <Ionicons name="pin" size={14} color="#3B82F6" />
                                            <Text
                                                style={styles.noticeTitle}
                                                numberOfLines={selectedNoticeId === notice.noticeId ? undefined : 1}
                                            >
                                                {notice.title}
                                            </Text>
                                        </View>
                                        <Text
                                            style={styles.noticeContent}
                                            numberOfLines={selectedNoticeId === notice.noticeId ? undefined : 1}
                                        >
                                            {notice.content}
                                        </Text>
                                        <View style={styles.noticeFooter}>
                                            <Text style={styles.noticeDate}>{formatDate(notice.createdAt)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Regular Notices */}
                        {regularNotices.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="megaphone-outline" size={16} color="#6B7280" />
                                    <Text style={styles.sectionTitle}>일반 공지</Text>
                                </View>
                                {regularNotices.map((notice) => (
                                    <TouchableOpacity
                                        key={notice.noticeId}
                                        style={[
                                            styles.noticeCard,
                                            selectedNoticeId === notice.noticeId && styles.selectedCard
                                        ]}
                                        onPress={() => setSelectedNoticeId(
                                            selectedNoticeId === notice.noticeId ? null : notice.noticeId
                                        )}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={styles.noticeTitle}
                                            numberOfLines={selectedNoticeId === notice.noticeId ? undefined : 1}
                                        >
                                            {notice.title}
                                        </Text>
                                        <Text
                                            style={styles.noticeContent}
                                            numberOfLines={selectedNoticeId === notice.noticeId ? undefined : 1}
                                        >
                                            {notice.content}
                                        </Text>
                                        <View style={styles.noticeFooter}>
                                            <Text style={styles.noticeDate}>{formatDate(notice.createdAt)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {notices.length === 0 && (
                            <View style={styles.emptyState}>
                                <Ionicons name="megaphone-outline" size={64} color="#D1D5DB" />
                                <Text style={styles.emptyStateText}>등록된 공지사항이 없습니다</Text>
                            </View>
                        )}
                    </ScrollView>
                )}
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
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    headerSpacer: {
        width: 32,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: 'black',
        paddingVertical: 8,
    },
    noticeCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    fixedNoticeCard: {
        borderColor: '#93C5FD',
        backgroundColor: '#EFF6FF',
    },
    selectedCard: {
        borderColor: '#3B82F6',
        borderWidth: 2,
    },
    noticeTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    noticeTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
        marginBottom: 8,
    },
    noticeContent: {
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 4,
    },
    noticeFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    noticeDate: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 16,
    },
});
