import React, {useEffect, useState} from 'react';
import {ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {trainerService} from "@/src/services/api";
import {useAssignmentStore} from "@/src/store/useAssignmentStore";
import {useAssignedMembersStore} from "@/src/store/useAssignedMembersStore";
import {getYearAndWeek} from "@/src/utils/dateUtils";
import FreeTimeScheduleDetailView from '@/src/components/freetimeschedule/FreeTimeScheduleDetailView';

export default function MemberManagementScreen() {
    const {assignmentRequests, setAssignmentRequests, setIsLoadingRequests} = useAssignmentStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const {members, setMembers, shouldRefetch} = useAssignedMembersStore();
    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
    const [showScheduleView, setShowScheduleView] = useState(false);

    // Store 데이터를 MemberInfo 형식으로 변환
    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            // 캐시가 있고 최신이면 API 호출 스킵
            if (members.length > 0 && !shouldRefetch()) {
                setIsLoading(false);
                return;
            }

            // API 호출
            const {targetYear, targetWeekOfYear} = getYearAndWeek();
            const nextWeekOfYear = targetWeekOfYear + 1;
            const response = await trainerService.getAssignedMembers(targetYear, nextWeekOfYear);

            // Store에 저장 (자동으로 리렌더링됨)
            setMembers(response.members);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setIsLoading(false);
        }
    };


    // Fetch trainer assignment requests
    useEffect(() => {
        fetchAssignmentRequests();
    }, []);


    const fetchAssignmentRequests = async () => {
        setIsLoadingRequests(true);
        try {
            const response = await trainerService.getAssignmentRequests();
            setAssignmentRequests(response.content);
        } catch (error) {
            console.error('Error fetching assignment requests:', error);
        } finally {
            setIsLoadingRequests(false);
        }
    };


    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    };

    const pendingRequestsCount = assignmentRequests.filter(req => req.status === 'PENDING').length;

    // 스케줄 상세 뷰 표시
    if (showScheduleView) {
        const selectedMember = members.find((member) => {
            return member.accountId === selectedMemberId
        });

        if (!selectedMember) {
            // 멤버를 찾지 못한 경우 목록으로 돌아감
            setShowScheduleView(false);
            return null;
        }

        return (
            <FreeTimeScheduleDetailView
                periodicScheduleLines={selectedMember.periodicSchedules || []}
                onetimeScheduleLines={selectedMember.onetimeSchedules || []}
                onClose={() => setShowScheduleView(false)}
            />
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6"/>
                    <Text style={styles.loadingText}>회원 목록을 불러오는 중...</Text>
                </View>
            ) : (
                <>
                    <View style={styles.header}>
                        <Text style={styles.title}>회원관리</Text>
                    </View>

                    {/* 관리 섹션 */}
                    <View style={styles.managementSection}>
                        {/* 담당자 요청 관리 버튼 */}
                        <TouchableOpacity
                            style={[
                                styles.managementButton,
                                pendingRequestsCount > 0 && styles.managementButtonActive
                            ]}
                            onPress={() => router.push('/assignment-requests')}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.managementIconContainer,
                                pendingRequestsCount > 0 && styles.managementIconActive
                            ]}>
                                <Ionicons
                                    name="person-add"
                                    size={24}
                                    color={pendingRequestsCount > 0 ? "#F59E0B" : "#6B7280"}
                                />
                                {pendingRequestsCount > 0 && (
                                    <View style={styles.managementIconBadge}>
                                        <Text style={styles.managementIconBadgeText}>{pendingRequestsCount}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[
                                styles.managementButtonText,
                                pendingRequestsCount > 0 && styles.managementButtonTextActive
                            ]}>
                                담당자 요청
                            </Text>
                        </TouchableOpacity>

                        {/* 공지사항 관리 버튼 */}
                        <TouchableOpacity
                            style={styles.managementButton}
                            onPress={() => router.push('/notices')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.managementIconContainer}>
                                <Ionicons
                                    name="megaphone-outline"
                                    size={24}
                                    color="#6B7280"
                                />
                            </View>
                            <Text style={styles.managementButtonText}>
                                공지사항
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {members.length > 0 ? (
                            <View style={styles.memberListSection}>
                                {members.map((member) => (
                                    <TouchableOpacity
                                        key={member.accountId}
                                        style={[
                                            styles.memberCard,
                                            selectedMemberId === member.accountId && styles.selectedCard
                                        ]}
                                        onPress={() => setSelectedMemberId(
                                            selectedMemberId === member.accountId ? null : member.accountId
                                        )}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.memberHeader}>
                                            <View style={styles.memberInfo}>
                                                <View style={styles.profileIcon}>
                                                    <Ionicons name="person-circle" size={40} color="#3B82F6"/>
                                                </View>
                                                <View style={styles.memberDetails}>
                                                    <Text style={styles.memberName}>{member.name}</Text>
                                                    <Text style={styles.memberPhone}>{member.phoneNumber}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {selectedMemberId === member.accountId && (
                                            <View style={styles.memberStats}>
                                                <View style={styles.statRow}>
                                                    <Text style={styles.statRowLabel}>마지막 세션</Text>
                                                    <Text style={styles.statRowValue}>
                                                        {formatDate(member.lastSessionDate)}
                                                    </Text>
                                                </View>
                                                <View style={styles.statRow}>
                                                    <Text style={styles.statRowLabel}>총 세션</Text>
                                                    <Text style={styles.statRowValue}>
                                                        {member.totalSessions}회
                                                    </Text>
                                                </View>

                                                <View style={styles.memberActions}>
                                                    <TouchableOpacity
                                                        style={styles.actionButton}
                                                        onPress={() => {
                                                            setShowScheduleView(true);
                                                        }}
                                                    >
                                                        <Ionicons name="calendar-outline" size={18} color="white"/>
                                                        <Text style={styles.actionButtonText}>트레이닝 가능 일정</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity style={styles.actionButton}>
                                                        <Ionicons name="chatbubble-outline" size={18} color="white"/>
                                                        <Text style={styles.actionButtonText}>메시지</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                                <Text style={styles.emptyStateText}>담당 회원이 없습니다</Text>
                            </View>
                        )}
                    </ScrollView>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    loadingText: {
        color: '#6B7280',
        marginTop: 12,
        fontSize: 14,
    },
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1F2937',
    },
    notificationButton: {
        position: 'relative',
        padding: 8,
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 100,
    },
    memberListSection: {
        gap: 12,
    },
    memberCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    selectedCard: {
        backgroundColor: '#E5E7EB',
        borderColor: '#3B82F6',
    },
    memberHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    memberInfo: {
        flexDirection: 'row',
        flex: 1,
    },
    profileIcon: {
        marginRight: 12,
    },
    memberDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    memberName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    memberPhone: {
        fontSize: 14,
        color: '#6B7280',
    },
    memberStats: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        marginTop: 12,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statRowLabel: {
        fontSize: 13,
        color: '#6B7280',
    },
    statRowValue: {
        fontSize: 13,
        color: '#1F2937',
        fontWeight: '600',
    },
    memberActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        paddingVertical: 10,
        gap: 6,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 16,
    },
    managementSection: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    managementButton: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 8,
    },
    managementButtonActive: {
        backgroundColor: '#FEF3C7',
        borderColor: '#FDE68A',
    },
    managementIconContainer: {
        position: 'relative',
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    managementIconActive: {
        backgroundColor: '#FEF3C7',
        borderColor: '#FDE68A',
    },
    managementIconBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#F59E0B',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: 'white',
    },
    managementIconBadgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
    },
    managementButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
    },
    managementButtonTextActive: {
        color: '#92400E',
    },
});
