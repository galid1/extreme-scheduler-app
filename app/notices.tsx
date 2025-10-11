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
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trainerNoticeService } from '@/src/services/api';
import { TrainerNoticeResponse } from '@/src/types/api';

export default function NoticesScreen() {
    const router = useRouter();
    const [notices, setNotices] = useState<TrainerNoticeResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // 초기 로드
    useEffect(() => {
        fetchNotices(true);
        setIsInitialLoad(false);
    }, []);

    // 화면 포커스될 때마다 백그라운드 새로고침
    useFocusEffect(
        React.useCallback(() => {
            if (!isInitialLoad) {
                fetchNotices(false);  // 백그라운드 새로고침
            }
        }, [isInitialLoad])
    );

    const fetchNotices = async (showLoading = false) => {
        if (showLoading) {
            setIsLoading(true);
        }
        try {
            const response = await trainerNoticeService.getNotices(undefined, 0, 50);
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

                                    {selectedNoticeId === notice.noticeId && (
                                        <View style={styles.noticeActions}>
                                            <TouchableOpacity
                                                style={styles.editButton}
                                                onPress={() => router.push({
                                                    pathname: '/notice-edit',
                                                    params: {
                                                        noticeId: notice.noticeId,
                                                        title: notice.title,
                                                        content: notice.content,
                                                    }
                                                })}
                                            >
                                                <Ionicons name="create-outline" size={16} color="white" />
                                                <Text style={styles.editButtonText}>수정</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.toggleFixButton}
                                                onPress={async () => {
                                                    try {
                                                        await trainerNoticeService.toggleNoticeFixed(notice.noticeId, !notice.fixed);
                                                        fetchNotices();
                                                    } catch (error) {
                                                        Alert.alert('오류', '고정 변경에 실패했습니다.');
                                                    }
                                                }}
                                            >
                                                <Ionicons name={notice.fixed ? "pin" : "pin-outline"} size={16} color="white" />
                                                <Text style={styles.toggleFixButtonText}>
                                                    {notice.fixed ? '고정 해제' : '고정'}
                                                </Text>
                                            </TouchableOpacity>
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

                                    {selectedNoticeId === notice.noticeId && (
                                        <View style={styles.noticeActions}>
                                            <TouchableOpacity
                                                style={styles.editButton}
                                                onPress={() => router.push({
                                                    pathname: '/notice-edit',
                                                    params: {
                                                        noticeId: notice.noticeId,
                                                        title: notice.title,
                                                        content: notice.content,
                                                    }
                                                })}
                                            >
                                                <Ionicons name="create-outline" size={16} color="white" />
                                                <Text style={styles.editButtonText}>수정</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.toggleFixButton}
                                                onPress={async () => {
                                                    try {
                                                        await trainerNoticeService.toggleNoticeFixed(notice.noticeId, !notice.fixed);
                                                        fetchNotices();
                                                    } catch (error) {
                                                        Alert.alert('오류', '고정 변경에 실패했습니다.');
                                                    }
                                                }}
                                            >
                                                <Ionicons name={notice.fixed ? "pin" : "pin-outline"} size={16} color="white" />
                                                <Text style={styles.toggleFixButtonText}>
                                                    {notice.fixed ? '고정 해제' : '고정'}
                                                </Text>
                                            </TouchableOpacity>
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
                onPress={() => router.push('/notice-edit')}
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
    noticeActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    editButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        borderRadius: 8,
        paddingVertical: 10,
        gap: 6,
    },
    editButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    toggleFixButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        paddingVertical: 10,
        gap: 6,
    },
    toggleFixButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    deleteButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EF4444',
        borderRadius: 8,
        paddingVertical: 10,
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
