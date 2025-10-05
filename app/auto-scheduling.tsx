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
import {useConfigStore} from '@/src/store/useConfigStore';
import {trainerScheduleService, trainerService} from '@/src/services/api';
import {getYearAndWeek} from "@/src/utils/dateUtils";
import {useAssignedMembersStore} from '@/src/store/useAssignedMembersStore';

interface Member {
    id: string;
    name: string;
    birthDate: string;
    gender: string;
    phoneNumber: string;
    periodicSchedules: Array<{
        id: number | null;
        dayOfWeek: string;
        startHour: number;
        endHour: number;
    }>;
    onetimeSchedules: Array<{
        id: number | null;
        scheduleDate: string;
        startHour: number;
        endHour: number;
    }>;
}

interface MemberSelection {
    memberId: string;
    sessionCount: number;
}

export default function AutoSchedulingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const {weekToReset, resetMode} = params;
    const {mockMode} = useConfigStore();
    const {members: storedMembers, setMembers: setStoredMembers, shouldRefetch} = useAssignedMembersStore();
    const [members, setMembers] = useState<Member[]>([]);
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
            if (mockMode) {
                // Mock data
                await new Promise(resolve => setTimeout(resolve, 1000));

                const mockMembers: Member[] = [
                    {
                        id: 'member_001',
                        name: '김민수',
                        birthDate: '1990-05-15',
                        gender: 'MALE',
                        phoneNumber: '010-1234-5678',
                        periodicSchedules: [
                            { id: 1, dayOfWeek: 'MONDAY', startHour: 9, endHour: 10 },
                            { id: 2, dayOfWeek: 'WEDNESDAY', startHour: 14, endHour: 15 },
                        ],
                        onetimeSchedules: [],
                    },
                    {
                        id: 'member_002',
                        name: '이영희',
                        birthDate: '1985-08-20',
                        gender: 'FEMALE',
                        phoneNumber: '010-2345-6789',
                        periodicSchedules: [
                            { id: 3, dayOfWeek: 'TUESDAY', startHour: 10, endHour: 11 },
                        ],
                        onetimeSchedules: [
                            { id: 4, scheduleDate: '2025-10-15', startHour: 16, endHour: 17 },
                        ],
                    },
                    {
                        id: 'member_003',
                        name: '박철수',
                        birthDate: '1992-03-10',
                        gender: 'MALE',
                        phoneNumber: '010-3456-7890',
                        periodicSchedules: [],
                        onetimeSchedules: [],
                    },
                    {
                        id: 'member_004',
                        name: '정미영',
                        birthDate: '1988-11-25',
                        gender: 'FEMALE',
                        phoneNumber: '010-4567-8901',
                        periodicSchedules: [
                            { id: 5, dayOfWeek: 'THURSDAY', startHour: 15, endHour: 16 },
                        ],
                        onetimeSchedules: [],
                    },
                    {
                        id: 'member_005',
                        name: '최준호',
                        birthDate: '1995-01-30',
                        gender: 'MALE',
                        phoneNumber: '010-5678-9012',
                        periodicSchedules: [],
                        onetimeSchedules: [],
                    },
                    {
                        id: 'member_006',
                        name: '강서연',
                        birthDate: '1993-07-05',
                        gender: 'FEMALE',
                        phoneNumber: '010-6789-0123',
                        periodicSchedules: [
                            { id: 6, dayOfWeek: 'FRIDAY', startHour: 18, endHour: 19 },
                            { id: 7, dayOfWeek: 'MONDAY', startHour: 11, endHour: 12 },
                        ],
                        onetimeSchedules: [],
                    },
                ];

                const sortedMembers = mockMembers;

                setMembers(sortedMembers);
            } else {
                // Real API call
                const { targetYear, targetWeekOfYear } = getYearAndWeek()
                const nextWeekOfYear = targetWeekOfYear + 1
                const response = await trainerService.getAssignedMembers(
                    targetYear,
                    nextWeekOfYear
                );

                const fetchedMembers: Member[] = response.members.map(member => ({
                    id: member.accountId.toString(),
                    name: member.name,
                    birthDate: member.birthDate,
                    gender: member.gender,
                    phoneNumber: member.phoneNumber,
                    periodicSchedules: member.periodicSchedules,
                    onetimeSchedules: member.onetimeSchedules,
                }));

                // Store에 저장
                setStoredMembers(response.members);
                setMembers(fetchedMembers);
            }
        } catch (error) {
            console.error('Error fetching members:', error);
            Alert.alert('오류', '회원 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMemberSelection = (memberId: string) => {
        setSelectedMembers(prev => {
            const existing = prev.find(m => m.memberId === memberId);
            if (existing) {
                return prev.filter(m => m.memberId !== memberId);
            } else {
                return [...prev, {memberId, sessionCount: 1}];
            }
        });
    };

    const updateSessionCount = (memberId: string, count: number) => {
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
            // Calculate target date
            const today = new Date();
            const dayOfWeek = today.getDay();
            const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
            const nextMonday = new Date(today);
            nextMonday.setDate(today.getDate() + daysUntilNextMonday);
            const targetDate = nextMonday.toISOString().split('T')[0];

            console.log()

            if (mockMode) {
                // Mock mode: 로컬에서 가짜 스케줄 생성
                await new Promise(resolve => setTimeout(resolve, 1700));

                const {setTrainingSessions, trainingSessions} = useTrainingStore.getState();
                const generatedSessions: any[] = [];

                // Calculate target week for mock mode
                const startOfYear = new Date(today.getFullYear(), 0, 1);
                const daysSinceStart = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
                const currentWeekOfYear = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
                const targetWeek = resetMode && weekToReset ? Number(weekToReset) : currentWeekOfYear + 1;

                const weekDays = ['월', '화', '수', '목', '금'];
                const timeSlots = [9, 10, 11, 14, 15, 16, 17, 18, 19, 20];

                selectedMembers.forEach((selection) => {
                    const member = members.find(m => m.id === selection.memberId);
                    if (!member) return;

                    for (let i = 0; i < selection.sessionCount; i++) {
                        const dayIndex = Math.floor(Math.random() * weekDays.length);
                        const hourIndex = Math.floor(Math.random() * timeSlots.length);

                        generatedSessions.push({
                            memberId: member.id,
                            memberName: member.name,
                            memberPhone: member.phoneNumber,
                            hour: timeSlots[hourIndex],
                            day: weekDays[dayIndex],
                            weekOfYear: targetWeek,
                        });
                    }
                });

                if (resetMode && weekToReset) {
                    const existingSessions = trainingSessions.filter(s => s.weekOfYear !== targetWeek);
                    setTrainingSessions([...existingSessions, ...generatedSessions]);
                } else {
                    setTrainingSessions([...trainingSessions, ...generatedSessions]);
                }
            } else {
                // Real API call
                const memberAccountIds = selectedMembers.map(sm => Number(sm.memberId));

                await trainerScheduleService.executeAutoScheduling({
                    memberAccountIds,
                    targetDate,
                });
            }

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
                                <Text style={styles.successSubtitle}>
                                    총 {selectedMembers.length}명의 회원, {getTotalSessionCount()}개 세션이 생성되었습니다
                                </Text>
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
                    members.map((member) => {
                    const hasSchedule = member.periodicSchedules.length > 0 || member.onetimeSchedules.length > 0;
                    const isReady = hasSchedule;
                    const selectedMember = selectedMembers.find(m => m.memberId === member.id);
                    const isSelected = !!selectedMember;
                    const totalSchedules = member.periodicSchedules.length + member.onetimeSchedules.length;

                    return (
                        <View key={member.id}>
                            <TouchableOpacity
                                style={[
                                    styles.memberCard,
                                    !isReady && styles.memberCardDisabled,
                                    isSelected && styles.memberCardSelected,
                                ]}
                                onPress={() => isReady && toggleMemberSelection(member.id)}
                                disabled={!isReady}
                                activeOpacity={0.8}
                            >
                                <View style={styles.memberCardHeader}>
                                    <View style={styles.memberInfo}>
                                        <View style={styles.memberNameRow}>
                                            <Text style={[
                                                styles.memberName,
                                                !isReady && styles.memberNameDisabled,
                                            ]}>
                                                {member.name}
                                            </Text>
                                            <View style={[
                                                styles.statusBadge,
                                                !isReady && styles.statusBadgeNotReady,
                                            ]}>
                                                <Text style={styles.statusText}>
                                                    {isReady ? 'READY' : 'NOT READY'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={[
                                            styles.memberPhone,
                                            !isReady && styles.memberPhoneDisabled,
                                        ]}>
                                            {member.phoneNumber}
                                        </Text>
                                        {isReady && (
                                            <View style={styles.memberMetaInfo}>
                                                <View style={styles.metaItem}>
                                                    <Ionicons name="time-outline" size={14} color="#666"/>
                                                    <Text style={styles.metaText}>
                                                        {totalSchedules}개 시간대
                                                    </Text>
                                                </View>
                                                <View style={styles.metaItem}>
                                                    <Ionicons name="calendar-outline" size={14} color="#666"/>
                                                    <Text style={styles.metaText}>
                                                        정기 {member.periodicSchedules.length}개 · 일회성 {member.onetimeSchedules.length}개
                                                    </Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                    <View style={[
                                        styles.checkbox,
                                        isSelected && styles.checkboxSelected,
                                        !isReady && styles.checkboxDisabled,
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
                                                    updateSessionCount(member.id, selectedMember.sessionCount - 1);
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
                                            <Text style={styles.sessionCountText}>{selectedMember.sessionCount}회</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.sessionCountButton}
                                            onPress={() => {
                                                if (selectedMember.sessionCount < 3) {
                                                    updateSessionCount(member.id, selectedMember.sessionCount + 1);
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
                })
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
    },
    statusText: {
        fontSize: 10,
        color: '#3B82F6',
        fontWeight: '700',
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
        marginBottom: 12,
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
});
