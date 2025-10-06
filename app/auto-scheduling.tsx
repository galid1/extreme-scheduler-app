import React, {useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {useTrainingStore} from '@/src/store/useTrainingStore';
import {trainerScheduleService, trainerService} from '@/src/services/api';
import {getYearAndWeek} from "@/src/utils/dateUtils";
import {useAssignedMembersStore} from '@/src/store/useAssignedMembersStore';

interface MemberSelection {
    memberId: number;
    sessionCount: number;
}

export default function AutoSchedulingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const {resetMode} = params;
    const {members, setMembers} = useAssignedMembersStore();
    const [selectedMembers, setSelectedMembers] = useState<MemberSelection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirmButton, setShowConfirmButton] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchMembers();
    }, []);

    useEffect(() => {
        if (isProcessing) {
            // Start rotation animation
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ).start();

            // Fade in animation
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isProcessing]);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            // Real API call
            const {targetYear, targetWeekOfYear} = getYearAndWeek()
            const nextWeekOfYear = targetWeekOfYear + 1
            const response = await trainerService.getAssignedMembers(
                targetYear,
                nextWeekOfYear
            );

            // Store에 저장
            setMembers(response.members);
        } catch (error) {
            console.error('Error fetching members:', error);
            Alert.alert('오류', '회원 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMemberSelection = (memberId: number) => {
        setSelectedMembers(prev => {
            const existing = prev.find(m => m.memberId === memberId);
            if (existing) {
                return prev.filter(m => m.memberId !== memberId);
            } else {
                return [...prev, {memberId, sessionCount: 1}];
            }
        });
    };

    const updateSessionCount = (memberId: number, count: number) => {
        setSelectedMembers(prev =>
            prev.map(m =>
                m.memberId === memberId ? {...m, sessionCount: count} : m
            )
        );
    };

    const getTotalSessionCount = () => {
        return selectedMembers.reduce((total, member) => total + member.sessionCount, 0);
    };

    const handleAutoSchedule = async () => {
        setIsProcessing(true);

        try {
            const {targetYear, targetWeekOfYear} = getYearAndWeek()
            const nextWeekOfYear = targetWeekOfYear + 1

            // Real API call
            const memberAccountIds = selectedMembers.map(sm => sm.memberId);

            const response = await trainerScheduleService.executeAutoScheduling({
                memberAccountIds: memberAccountIds,
                targetYear: targetYear,
                targetWeekOfYear: nextWeekOfYear,
            });


            setShowConfirmButton(true);
        } catch (error: any) {
            console.error('Auto scheduling error:', error);
            Alert.alert(
                '스케줄링 실패',
                error.message || '자동 스케줄링에 실패했습니다. 다시 시도해주세요.'
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmSchedule = () => {
        // 재설정 모드인 경우 해당 주차로, 아니면 다음 주차로 설정
        // 일반 모드: 다음 주차로 이동
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const daysSinceStart = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
        const currentWeekOfYear = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
        const targetWeek = currentWeekOfYear + 1;

        // Store에 타겟 주차 설정
        const {setCurrentWeek} = useTrainingStore.getState();
        setCurrentWeek(targetWeek);

        // training-schedule로 이동 (replace로 스택 교체)
        router.replace('/training-schedule');
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6"/>
                    <Text style={styles.loadingText}>회원 목록을 불러오는 중...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (isProcessing || showConfirmButton) {
        const spin = rotateAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
        });

        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.processingContainer}>
                    <Animated.View
                        style={[
                            styles.processingContent,
                            {
                                opacity: fadeAnim,
                                transform: [{scale: scaleAnim}],
                            },
                        ]}
                    >
                        {!showConfirmButton ? (
                            <>
                                <Animated.View
                                    style={{
                                        transform: [{rotate: spin}],
                                    }}
                                >
                                    <Ionicons name="sync" size={64} color="#3B82F6"/>
                                </Animated.View>
                                <Text style={styles.processingTitle}>자동 스케줄링 중...</Text>
                                <Text style={styles.processingSubtitle}>
                                    {selectedMembers.length}명의 회원, 총 {getTotalSessionCount()}개 세션을 최적화하고 있습니다
                                </Text>
                                <ActivityIndicator
                                    size="large"
                                    color="#666"
                                    style={{marginTop: 20}}
                                />
                            </>
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={80} color="#4ADE80"/>
                                <Text style={styles.successTitle}>스케줄링 완료!</Text>
                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={handleConfirmSchedule}
                                >
                                    <Text style={styles.confirmButtonText}>스케줄 확인</Text>
                                    <Ionicons name="arrow-forward" size={20} color="white"/>
                                </TouchableOpacity>
                            </>
                        )}
                    </Animated.View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        // 재설정 모드면 replace로 돌아가고, 일반 모드면 back
                        if (resetMode) {
                            router.replace('/training-schedule');
                        } else {
                            router.back();
                        }
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color="#3B82F6"/>
                </TouchableOpacity>
                <Text style={styles.title}>
                    자동 스케줄링
                </Text>
                <View style={{width: 44}}/>
            </View>

            <View style={styles.descriptionContainer}>
                <Text style={styles.description}>
                    일정을 등록한 회원들을 선택하여 자동으로 스케줄을 생성합니다
                </Text>
            </View>

            <ScrollView
                style={styles.membersList}
                contentContainerStyle={styles.membersListContent}
                showsVerticalScrollIndicator={false}
            >
                {members.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color="#D1D5DB"/>
                        <Text style={styles.emptyTitle}>배정된 회원이 없습니다</Text>
                        <Text style={styles.emptySubtitle}>
                            회원 배정 요청을 수락하거나{'\n'}
                            회원을 직접 추가해주세요
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* READY 회원 섹션 */}
                        {members.filter(m => m.periodicSchedules.length > 0 || m.onetimeSchedules.length > 0).length > 0 && (
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10B981"/>
                                    <Text style={styles.sectionTitle}>일정 등록 완료</Text>
                                    <Text style={styles.sectionCount}>
                                        {members.filter(m => m.periodicSchedules.length > 0 || m.onetimeSchedules.length > 0).length}명
                                    </Text>
                                </View>
                                {members.filter(m => m.periodicSchedules.length > 0 || m.onetimeSchedules.length > 0).map((member) => {
                                    const selectedMember = selectedMembers.find(m => m.memberId === member.accountId);
                                    const isSelected = !!selectedMember;
                                    const totalSchedules = member.periodicSchedules.length + member.onetimeSchedules.length;

                                    return (
                                        <View key={member.accountId}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.memberCard,
                                                    isSelected && styles.memberCardSelected,
                                                ]}
                                                onPress={() => toggleMemberSelection(member.accountId)}
                                                activeOpacity={0.8}
                                            >
                                                <View style={styles.memberCardHeader}>
                                                    <View style={styles.memberInfo}>
                                                        <View style={styles.memberNameRow}>
                                                            <Text style={styles.memberName}>
                                                                {member.name}
                                                            </Text>
                                                            <View style={styles.statusBadge}>
                                                                <Text style={styles.statusText}>READY</Text>
                                                            </View>
                                                        </View>
                                                        <Text style={styles.memberPhone}>
                                                            {member.phoneNumber}
                                                        </Text>
                                                        <View style={styles.memberMetaInfo}>
                                                            <View style={styles.metaItem}>
                                                                <Ionicons name="time-outline" size={14} color="#666"/>
                                                                <Text style={styles.metaText}>
                                                                    {totalSchedules}개 시간대
                                                                </Text>
                                                            </View>
                                                            <View style={styles.metaItem}>
                                                                <Ionicons name="calendar-outline" size={14}
                                                                          color="#666"/>
                                                                <Text style={styles.metaText}>
                                                                    정기 {member.periodicSchedules.length}개 ·
                                                                    일회성 {member.onetimeSchedules.length}개
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                    <View style={[
                                                        styles.checkbox,
                                                        isSelected && styles.checkboxSelected,
                                                    ]}>
                                                        {isSelected && (
                                                            <Ionicons name="checkmark" size={18} color="white"/>
                                                        )}
                                                    </View>
                                                </View>
                                            </TouchableOpacity>

                                            {isSelected && (
                                                <View style={styles.sessionCountContainer}>
                                                    <View style={styles.sessionCountSelector}>
                                                        <Text style={styles.sessionCountLabel}>주간 세션:</Text>
                                                        <TouchableOpacity
                                                            style={styles.sessionCountButton}
                                                            onPress={() => {
                                                                if (selectedMember.sessionCount > 1) {
                                                                    updateSessionCount(member.accountId, selectedMember.sessionCount - 1);
                                                                }
                                                            }}
                                                            disabled={selectedMember.sessionCount <= 1}
                                                        >
                                                            <Ionicons
                                                                name="remove-circle"
                                                                size={20}
                                                                color={selectedMember.sessionCount <= 1 ? "#D1D5DB" : "#3B82F6"}
                                                            />
                                                        </TouchableOpacity>
                                                        <View style={styles.sessionCountDisplay}>
                                                            <Text
                                                                style={styles.sessionCountText}>{selectedMember.sessionCount}회</Text>
                                                        </View>
                                                        <TouchableOpacity
                                                            style={styles.sessionCountButton}
                                                            onPress={() => {
                                                                if (selectedMember.sessionCount < 3) {
                                                                    updateSessionCount(member.accountId, selectedMember.sessionCount + 1);
                                                                }
                                                            }}
                                                            disabled={selectedMember.sessionCount >= 3}
                                                        >
                                                            <Ionicons
                                                                name="add-circle"
                                                                size={20}
                                                                color={selectedMember.sessionCount >= 3 ? "#D1D5DB" : "#3B82F6"}
                                                            />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {/* NOT READY 회원 섹션 */}
                        {members.filter(m => m.periodicSchedules.length === 0 && m.onetimeSchedules.length === 0).length > 0 && (
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="alert-circle-outline" size={20} color="#9CA3AF"/>
                                    <Text style={[styles.sectionTitle, styles.sectionTitleNotReady]}>일정 미등록</Text>
                                    <Text style={styles.sectionCount}>
                                        {members.filter(m => m.periodicSchedules.length === 0 && m.onetimeSchedules.length === 0).length}명
                                    </Text>
                                </View>
                                {members.filter(m => m.periodicSchedules.length === 0 && m.onetimeSchedules.length === 0).map((member) => {
                                    return (
                                        <View key={member.accountId}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.memberCard,
                                                    styles.memberCardDisabled,
                                                ]}
                                                disabled={true}
                                                activeOpacity={0.8}
                                            >
                                                <View style={styles.memberCardHeader}>
                                                    <View style={styles.memberInfo}>
                                                        <View style={styles.memberNameRow}>
                                                            <Text style={[
                                                                styles.memberName,
                                                                styles.memberNameDisabled,
                                                            ]}>
                                                                {member.name}
                                                            </Text>
                                                            <View style={styles.statusBadgeNotReady}>
                                                                <Text
                                                                    style={[styles.statusText, styles.statusTextNotReady]}>
                                                                    NOT READY
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <Text style={[
                                                            styles.memberPhone,
                                                            styles.memberPhoneDisabled,
                                                        ]}>
                                                            {member.phoneNumber}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.checkboxDisabled}>
                                                        <Ionicons name="close" size={18} color="#D1D5DB"/>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <View style={styles.bottomBar}>
                {selectedMembers.length > 0 && (
                    <View style={styles.selectedInfo}>
                        <Text style={styles.selectedCount}>
                            {selectedMembers.length}명 선택 · 총 {getTotalSessionCount()}개 세션
                        </Text>
                    </View>
                )}
                <TouchableOpacity
                    style={[
                        styles.proceedButton,
                        selectedMembers.length === 0 && styles.proceedButtonDisabled,
                    ]}
                    onPress={handleAutoSchedule}
                    disabled={selectedMembers.length === 0}
                >
                    <Text style={[
                        styles.proceedButtonText,
                        selectedMembers.length === 0 && styles.proceedButtonTextDisabled,
                    ]}>자동 스케줄링 시작</Text>
                    <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={selectedMembers.length === 0 ? "#999" : "white"}
                    />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#333',
        fontSize: 16,
        marginTop: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    descriptionContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    description: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    membersList: {
        flex: 1,
    },
    membersListContent: {
        padding: 16,
    },
    memberCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    memberCardDisabled: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E0E0E0',
        opacity: 0.6,
    },
    memberCardSelected: {
        backgroundColor: '#E8F2FF',
        borderColor: '#3B82F6',
        borderWidth: 2,
    },
    memberCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    memberInfo: {
        flex: 1,
    },
    memberNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 8,
    },
    memberName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    memberNameDisabled: {
        color: '#999',
    },
    statusBadge: {
        backgroundColor: '#E8F2FF',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    statusBadgeNotReady: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E0E0E0',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 10,
        color: '#3B82F6',
        fontWeight: '700',
    },
    statusTextNotReady: {
        color: '#9CA3AF',
    },
    memberPhone: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    memberPhoneDisabled: {
        color: '#999',
    },
    memberMetaInfo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#666',
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    checkboxDisabled: {
        borderColor: '#E0E0E0',
        backgroundColor: '#F3F4F6',
    },
    bottomBar: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 30,
        backgroundColor: '#F8F9FA',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    selectedInfo: {
        marginBottom: 12,
    },
    selectedCount: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    proceedButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 14,
        paddingVertical: 16,
        gap: 8,
    },
    proceedButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    proceedButtonDisabled: {
        backgroundColor: '#E0E0E0',
        opacity: 0.6,
    },
    proceedButtonTextDisabled: {
        color: '#999',
    },
    processingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    processingContent: {
        alignItems: 'center',
    },
    processingTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        marginTop: 30,
        marginBottom: 12,
    },
    processingSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        marginTop: 20,
        marginBottom: 40,
    },
    successSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 32,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    confirmButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    sessionCountContainer: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginTop: -10,
        marginBottom: 12,
        marginHorizontal: 16,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        borderWidth: 1,
        borderColor: '#3B82F6',
        borderTopWidth: 0,
    },
    sessionCountLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginRight: 12,
    },
    sessionCountSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
    },
    sessionCountButton: {
        padding: 2,
    },
    sessionCountDisplay: {
        backgroundColor: 'white',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    sessionCountText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#3B82F6',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
    },
    sectionTitleNotReady: {
        color: '#6B7280',
    },
    sectionCount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
});
