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
import FreeTimeScheduleDetailView from '@/src/components/trainer/FreeTimeScheduleDetailView';

export default function ApprovedMembersScreen() {
    const router = useRouter();
    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
    const [showScheduleView, setShowScheduleView] = useState(false);
    const {members} = useAssignedMembersStore();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    };

    if (showScheduleView) {
        const selectedMember = members.find((member, idx) => {
            return member.accountId === selectedMemberId
        })

        return (
            <FreeTimeScheduleDetailView
                periodicScheduleLines={selectedMember?.periodicSchedules}
                onetimeScheduleLines={selectedMember?.onetimeSchedules}
                onClose={() => setShowScheduleView(false)}
                onEdit={() => {
                    setShowScheduleView(false);
                }}
            />
        );
    }

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
                    <>
                        {members.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>활성 회원 ({members.length})</Text>
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
                                                    <Text style={styles.statRowLabel}>최근 세션</Text>
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
                        )}
                    </>
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
