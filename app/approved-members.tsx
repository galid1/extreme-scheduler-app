import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {trainerService} from '@/src/services/api';
import {getYearAndWeek} from '@/src/utils/dateUtils';
import {useAssignedMembersStore} from '@/src/store/useAssignedMembersStore';

export default function ApprovedMembersScreen() {
    const router = useRouter();
    const {members, setMembers, shouldRefetch} = useAssignedMembersStore();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<string | null>(null);

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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return {bg: 'rgba(34, 197, 94, 0.3)', border: 'rgba(34, 197, 94, 0.5)'};
            case 'PAUSED':
                return {bg: 'rgba(251, 146, 60, 0.3)', border: 'rgba(251, 146, 60, 0.5)'};
            case 'PENDING':
                return {bg: 'rgba(91, 153, 247, 0.3)', border: '#5B99F7'};
            default:
                return {bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)'};
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return '활성';
            case 'PAUSED':
                return '일시중지';
            case 'PENDING':
                return '대기중';
            default:
                return status;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#3B82F6"/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>담당 회원 목록</Text>
                <View style={{width: 44}}/>
            </View>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3B82F6"/>
                        <Text style={styles.loadingText}>회원 목록을 불러오는 중...</Text>
                    </View>
                ) : (
                    <>
                        {members.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>활성 회원 ({members.length})</Text>
                                {members.map((member) => (
                                    <TouchableOpacity
                                        key={member.accountId}
                                        style={[
                                            styles.memberCard,
                                            selectedMember === member.accountId && styles.selectedCard
                                        ]}
                                        onPress={() => setSelectedMember(
                                            selectedMember === member.accountId ? null : member.accountId
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

                                        {selectedMember === member.accountId && (
                                            <View style={styles.memberStats}>
                                                <View style={styles.statRow}>
                                                    <Text style={styles.statRowLabel}>최근 세션</Text>
                                                    <Text style={styles.statRowValue}>
                                                        {formatDate(member.lastSessionDate)}
                                                    </Text>
                                                </View>
                                                <View style={styles.statRow}>
                                                    <Text style={styles.statRowLabel}>예정 세션</Text>
                                                    <Text style={styles.statRowValue}>
                                                        {member.upcomingSessions}회
                                                    </Text>
                                                </View>
                                                <View style={styles.statRow}>
                                                    <Text style={styles.statRowLabel}>총 세션</Text>
                                                    <Text style={styles.statRowValue}>
                                                        {member.totalSessions}회
                                                    </Text>
                                                </View>

                                                <View style={styles.memberActions}>
                                                    <TouchableOpacity style={styles.actionButton}>
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
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
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
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#3B82F6',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: 700,
        color: '#6B7280',
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 20,
    },
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    memberCard: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    selectedCard: {
        backgroundColor: '#E5E7EB',
        borderColor: '#3B82F6',
    },
    inactiveCard: {
        opacity: 0.7,
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
    inactiveText: {
        color: '#9CA3AF',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusText: {
        color: '#1F2937',
        fontSize: 12,
        fontWeight: '700',
    },
    memberStats: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
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
});
