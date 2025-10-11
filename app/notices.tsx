import React, { useEffect, useState } from 'react';
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
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trainerNoticeService } from '@/src/services/api';
import { TrainerNoticeResponse } from '@/src/types/api';

export default function NoticesScreen() {
    const router = useRouter();
    const [notices, setNotices] = useState<TrainerNoticeResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        setIsLoading(true);
        try {
            const response = await trainerNoticeService.getNotices(true, 0, 50);
            console.log("###############")
            console.log(JSON.stringify(response))
            setNotices(response.notices);
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

    const handleDeleteNotice = async (noticeId: number, title: string) => {
        Alert.alert(
            '공지사항 삭제',
            `"${title}" 공지사항을 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await trainerNoticeService.deleteNotice(noticeId);
                            Alert.alert('완료', '공지사항이 삭제되었습니다.');
                            fetchNotices();
                            setSelectedNoticeId(null);
                        } catch (error) {
                            console.error('Error deleting notice:', error);
                            Alert.alert('오류', '공지사항 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
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
                <Text style={styles.headerTitle}>공지사항 관리</Text>
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
                                <Ionicons name="pin" size={16} color="#3B82F6" />
                                <Text style={styles.sectionTitle}>고정 공지</Text>
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
                                    <View style={styles.noticeHeader}>
                                        <View style={styles.noticeTitleRow}>
                                            <Ionicons name="pin" size={14} color="#3B82F6" />
                                            <Text style={styles.noticeTitle}>{notice.title}</Text>
                                        </View>
                                        <Text style={styles.noticeDate}>{formatDate(notice.createdAt)}</Text>
                                    </View>
                                    <Text style={styles.noticeContent} numberOfLines={2}>
                                        {notice.content}
                                    </Text>

                                    {selectedNoticeId === notice.noticeId && (
                                        <View style={styles.noticeActions}>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => handleDeleteNotice(notice.noticeId, notice.title)}
                                            >
                                                <Ionicons name="trash-outline" size={16} color="white" />
                                                <Text style={styles.deleteButtonText}>삭제</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
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
                                    <View style={styles.noticeHeader}>
                                        <Text style={styles.noticeTitle}>{notice.title}</Text>
                                        <Text style={styles.noticeDate}>{formatDate(notice.createdAt)}</Text>
                                    </View>
                                    <Text style={styles.noticeContent} numberOfLines={2}>
                                        {notice.content}
                                    </Text>

                                    {selectedNoticeId === notice.noticeId && (
                                        <View style={styles.noticeActions}>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => handleDeleteNotice(notice.noticeId, notice.title)}
                                            >
                                                <Ionicons name="trash-outline" size={16} color="white" />
                                                <Text style={styles.deleteButtonText}>삭제</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
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

            {/* Create Button */}
            <TouchableOpacity
                style={styles.createButton}
                onPress={() => {
                    // TODO: Navigate to create notice screen
                    Alert.alert('준비중', '공지사항 작성 기능은 준비중입니다.');
                }}
            >
                <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
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
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
    },
    noticeCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
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
    noticeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    noticeTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    noticeTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
    },
    noticeDate: {
        fontSize: 12,
        color: '#9CA3AF',
        marginLeft: 8,
    },
    noticeContent: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    noticeActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EF4444',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 6,
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
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
    createButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
});
