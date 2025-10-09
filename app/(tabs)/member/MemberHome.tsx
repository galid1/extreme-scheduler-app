import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, AppState, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {useAuthStore} from '@/src/store/useAuthStore';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {authService, memberScheduleService, memberService} from '@/src/services/api';
import type {OnetimeScheduleLine, PeriodicScheduleLine} from '@/src/types/api';
import {useConfigStore} from '@/src/store/useConfigStore';
import {getYearAndWeek} from '@/src/utils/dateUtils';
import TrainerSearchComponent from '@/src/components/member/TrainerSearchComponent';
import FreeTimeScheduleDetailView from '@/src/components/freetimeschedule/FreeTimeScheduleDetailView';
import {useSchedulingEventStore} from '@/src/store/useSchedulingEventStore';


export default function MemberHome() {
    const router = useRouter();
    const {
        account,
        member,
        setTrainerAccountId,
        setAccountData,
        setAssignedTrainer,
    } = useAuthStore();
    const name = account?.privacyInfo?.name;
    const trainerAccountId = member?.trainerAccountId;

    const appStateRef = useRef(AppState.currentState);
    const {shouldRefresh} = useSchedulingEventStore();
    const [showScheduleDetail, setShowScheduleDetail] = useState(false);
    const [showScheduleEditFromDetail, setShowScheduleEditFromDetail] = useState(false);
    const [showMenuDropdown, setShowMenuDropdown] = useState(false);
    const [scheduleData, setScheduleData] = useState<{
        periodicScheduleLines: PeriodicScheduleLine[],
        onetimeScheduleLines: OnetimeScheduleLine[]
    }>({periodicScheduleLines: [], onetimeScheduleLines: []});

    // Local state for auto scheduling results and registration status
    const [fixedAutoSchedulingResults, setFixedAutoSchedulingResults] = useState<any[] | null>(null);
    const [weeklyScheduleRegistration, setWeeklyScheduleRegistration] = useState<any | null>(null);

    const {mockMode} = useConfigStore();

    // Helper function to check if auto scheduling is completed with results
    const hasAutoSchedulingResults = () => {
        return fixedAutoSchedulingResults !== null && fixedAutoSchedulingResults?.length > 0;
    };

    // Fetch user data and assigned trainer
    const fetchUserData = useCallback(async () => {
        if (!account || mockMode) return;

        try {
            const userResponse = await authService.getCurrentUser();
            if (userResponse.member) {
                setAccountData({
                    account: userResponse.account,
                    member: userResponse.member,
                    trainer: userResponse.trainer
                });

                // Fetch assigned trainer if member has trainerAccountId
                if (userResponse.member.trainerAccountId) {
                    try {
                        const assignedTrainerResponse = await memberService.getAssignedTrainer();
                        setAssignedTrainer(assignedTrainerResponse);
                    } catch (error) {
                        console.error('Error fetching assigned trainer:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }, [account, mockMode]);

    // Load schedule data
    const loadScheduleData = useCallback(async () => {
        try {
            const {targetYear, targetWeekOfYear} = getYearAndWeek();
            const nextWeekOfYear = targetWeekOfYear + 1;

            // Load all APIs in parallel
            const [registrationResponse, autoSchedulingResponse, freeTimeScheduleResponse] = await Promise.all([
                memberScheduleService.checkWeeklyScheduleRegistration(targetYear, nextWeekOfYear),
                memberScheduleService.getFixedAutoSchedulingResult(targetYear, nextWeekOfYear),
                memberScheduleService.getFreeSchedule(),
            ]);

            setWeeklyScheduleRegistration(registrationResponse);
            setFixedAutoSchedulingResults(autoSchedulingResponse.data);
            setScheduleData({
                periodicScheduleLines: freeTimeScheduleResponse.periodicScheduleLines,
                onetimeScheduleLines: freeTimeScheduleResponse.onetimeScheduleLines,
            });
        } catch (error) {
            console.error('Error loading schedule data:', error);
        }
    }, [member]);

    // Load initial data - can be called from buttons/events
    const loadInitialData = useCallback(async () => {
        await fetchUserData();
        await loadScheduleData();
    }, [fetchUserData, loadScheduleData]);

    // Load all data on mount
    useEffect(() => {
        loadInitialData();
    }, []);

    // 자동 스케줄링 완료 시 데이터 새로고침
    useEffect(() => {
        if (shouldRefresh > 0) {
            console.log('🎉 Scheduling completed, refreshing data...');
            loadInitialData();
        }
    }, [shouldRefresh]);

    // Update data when app comes to foreground
    useEffect(() => {
        const handleAppStateChange = async (nextAppState: string) => {
            if (
                appStateRef.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                console.log('App has come to the foreground!');
                await fetchUserData();
                await loadScheduleData();
            }
            appStateRef.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [fetchUserData, loadScheduleData]);

    // Show trainer assignment UI if no trainer assigned
    if (!trainerAccountId) {
        return (
            <TrainerSearchComponent
                mockMode={mockMode}
                onAssignmentSuccess={setTrainerAccountId}
            />
        );
    }

    // Show schedule detail view (or edit mode from detail)
    if (showScheduleDetail || showScheduleEditFromDetail || weeklyScheduleRegistration?.registered === false) {
        const isInitialRegistration = weeklyScheduleRegistration?.registered === false;
        const isEditMode = showScheduleEditFromDetail || isInitialRegistration;

        return (
            <FreeTimeScheduleDetailView
                periodicScheduleLines={scheduleData.periodicScheduleLines}
                onetimeScheduleLines={scheduleData.onetimeScheduleLines}
                onClose={async () => {
                    setShowScheduleDetail(false);
                    setShowScheduleEditFromDetail(false);
                    // Reload data after closing
                    if (isEditMode) {
                        await loadInitialData();
                    }
                }}
                initialEditMode={isEditMode}
            />
        );
    }

    // Default home screen for trainers or members with assigned trainer
    return (
        <SafeAreaView style={styles.container}>
            {/*<MockModeToggle/>*/}
            <View style={styles.topHeader}>
                <Text style={styles.welcomeText}>안녕하세요, {name}님!</Text>
                {trainerAccountId && (
                    <TouchableOpacity
                        style={styles.trainerBadge}
                        onPress={() => router.push('/trainer-profile')}
                    >
                        <Text style={styles.trainerBadgeText}>담당 트레이너</Text>
                        <Ionicons name="chevron-forward" size={14} color="#999"/>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Show schedule management when schedule is registered */}
                {trainerAccountId && weeklyScheduleRegistration?.registered === true && (
                    <View style={[styles.trainerDashboard, {marginTop: 20}]}>
                        <View style={styles.dashboardHeaderRow}>
                            <View style={styles.dashboardTitleContainer}>
                                <Text style={styles.dashboardTitle}>내 희망 일정 관리</Text>
                                <View style={styles.statusBadge}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10B981"/>
                                    <Text style={styles.statusBadgeText}>READY</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.menuButton}
                                onPress={() => setShowMenuDropdown(!showMenuDropdown)}
                            >
                                <Ionicons name="ellipsis-vertical" size={15} color="#6B7280"/>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.infoTooltip}>
                            <Ionicons name="information-circle-outline" size={16} color="#6B7280"/>
                            <Text style={styles.infoTooltipText}>
                                트레이너가 차주 스케줄링 대상으로 포함할 수 있습니다
                            </Text>
                        </View>

                        {/* Dropdown Menu */}
                        {showMenuDropdown && (
                            <View style={styles.dropdownMenu}>
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={async () => {
                                        setShowMenuDropdown(false);
                                        try {
                                            // Skip API call in mock mode
                                            if (mockMode) {
                                                return;
                                            }

                                            // Reload data to check latest status
                                            await loadInitialData();

                                            // Check if trainer has already scheduled
                                            if (hasAutoSchedulingResults()) {
                                                Alert.alert(
                                                    '일정 취소 불가',
                                                    '이미 트레이너가 스케줄링을 완료했습니다. 일정을 취소할 수 없습니다.',
                                                    [{text: '확인', style: 'default'}]
                                                );
                                                return;
                                            }

                                            // Show confirmation dialog
                                            Alert.alert(
                                                '일정 취소',
                                                '등록한 일정을 취소하시겠습니까?',
                                                [
                                                    {text: '아니오', style: 'cancel'},
                                                    {
                                                        text: '예',
                                                        style: 'destructive',
                                                        onPress: async () => {
                                                            try {
                                                                if (!mockMode) {
                                                                    const {targetYear, targetWeekOfYear} = getYearAndWeek();
                                                                    const nextWeekOfYear = targetWeekOfYear + 1;

                                                                    await memberScheduleService.unRegisterWeeklyFreeTimeSchedule({
                                                                        targetYear,
                                                                        targetWeekOfYear: nextWeekOfYear
                                                                    });
                                                                }
                                                                await loadInitialData();
                                                                Alert.alert('완료', '일정이 취소되었습니다.');
                                                            } catch (error: any) {
                                                                console.error('Unregister error:', error);
                                                                Alert.alert(
                                                                    '취소 실패',
                                                                    error.message || '일정 취소에 실패했습니다.'
                                                                );
                                                            }
                                                        }
                                                    }
                                                ]
                                            );
                                        } catch (error) {
                                            console.error('Error checking schedule status:', error);
                                            Alert.alert('오류', '일정 상태 확인에 실패했습니다.');
                                        }
                                    }}
                                >
                                    <Ionicons name="close-circle-outline" size={20} color="#EF4444"/>
                                    <Text style={styles.dropdownItemTextDanger}>일정 취소</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.scheduleButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.modifyScheduleButton, {flex: 1}]}
                                onPress={() => setShowScheduleDetail(true)}
                            >
                                <Ionicons name="calendar" size={20} color="white"/>
                                <Text style={styles.modifyScheduleButtonText}>일정 보기</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modifyScheduleButton, {flex: 1}]}
                                onPress={async () => {
                                    try {
                                        // Skip API call in mock mode
                                        if (mockMode) {
                                            setShowScheduleEditFromDetail(true);
                                            return;
                                        }

                                        // Reload data to check latest status
                                        await loadInitialData();

                                        // Check if trainer has already scheduled
                                        if (hasAutoSchedulingResults()) {
                                            Alert.alert(
                                                '일정 수정 불가',
                                                '이미 트레이너가 스케줄링을 완료했습니다. 일정을 수정할 수 없습니다.',
                                                [{text: '확인', style: 'default'}]
                                            );
                                            return;
                                        }

                                        setShowScheduleEditFromDetail(true);
                                    } catch (error) {
                                        console.error('Error checking schedule status:', error);
                                        Alert.alert('오류', '일정 상태 확인에 실패했습니다.');
                                    }
                                }}
                            >
                                <Ionicons name="create" size={20} color="white"/>
                                <Text style={styles.modifyScheduleButtonText}>일정 수정</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Show member's scheduled state */}
                {trainerAccountId && hasAutoSchedulingResults() && (
                    <View style={styles.scheduledStateContainer}>
                        <View style={styles.scheduledStateCard}>
                            <View style={styles.scheduledStateHeader}>
                                <Ionicons name="information-circle" size={48} color="#3B82F6"/>
                                <Text style={styles.scheduledStateTitle}>스케줄링 완료</Text>
                            </View>
                            {!hasAutoSchedulingResults() ? (
                                <>
                                    <Text style={styles.scheduledStateMessage}>
                                        이번 주는 트레이너와의 일정이 맞지 않아{' '}
                                        스케줄된 세션이 없습니다.
                                    </Text>
                                    <Text style={styles.scheduledStateSubMessage}>
                                        다음 주에는 트레이너와 일정을 조율하여{' '}
                                        트레이닝 세션이 배정될 예정입니다.
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.scheduledStateMessage}>
                                        트레이닝 일정이 확정되었습니다.
                                    </Text>
                                    <Text style={styles.scheduledStateSubMessage}>
                                        확정된 일정을 확인해주세요.
                                    </Text>
                                </>
                            )}
                            <View style={styles.scheduledStateInfo}>
                                <Ionicons name="calendar-outline" size={20} color="#6B7280"/>
                                <Text style={styles.scheduledStateInfoText}>
                                    매주 일요일에 다음 주 일정이 확정됩니다
                                </Text>
                            </View>
                        </View>

                        {/* Button to contact trainer */}
                        <TouchableOpacity
                            style={styles.contactTrainerButton}
                            onPress={() => router.push('/trainer-profile')}
                        >
                            <Ionicons name="chatbubbles-outline" size={20} color="#3B82F6"/>
                            <Text style={styles.contactTrainerButtonText}>담당 트레이너 연락처 확인</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        marginBottom: 30,
        marginTop: 20,
    },
    welcomeText: {
        fontSize: 18,
        color: '#333',
        fontWeight: '700',
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    inputSection: {
        marginTop: 20,
    },
    inputLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 12,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginTop: 12,
    },
    phoneIcon: {
        marginRight: 12,
    },
    phoneInput: {
        flex: 1,
        fontSize: 18,
        color: '#1F2937',
        paddingVertical: 12,
    },
    searchingIndicator: {
        marginLeft: 12,
    },
    loadingContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    loadingText: {
        color: '#333',
        marginTop: 10,
        fontSize: 14,
    },
    profileCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    profileHeader: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    profileIcon: {
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    profilePhone: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    gymBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    gymText: {
        fontSize: 13,
        color: '#6B7280',
    },
    profileExperience: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        color: '#333',
        marginLeft: 4,
        fontSize: 14,
    },
    specialtiesContainer: {
        marginBottom: 20,
    },
    specialtiesTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    specialtiesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    specialtyTag: {
        backgroundColor: '#e3f2fd',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    specialtyText: {
        color: '#3B82F6',
        fontSize: 12,
    },
    assignButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
    },
    assignButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    assignButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    errorCard: {
        flexDirection: 'row',
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        flex: 1,
    },
    confirmButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    trainerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#999',
    },
    trainerBadgeText: {
        color: '#999',
        fontSize: 12,
        fontWeight: '700',
        marginRight: 4,
    },
    trainerScheduleContainer: {
        padding: 20,
    },
    trainerDashboard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#3B82F6',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    dashboardTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
    },
    dashboardTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10B981',
    },
    infoTooltip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 16,
    },
    infoTooltipText: {
        fontSize: 13,
        color: '#6B7280',
        flex: 1,
    },
    dashboardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    menuButton: {
        padding: 8,
    },
    dropdownMenu: {
        position: 'absolute',
        top: 50,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1000,
        minWidth: 150,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    dropdownItemTextDanger: {
        fontSize: 15,
        color: '#EF4444',
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statCard: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'white',
        minWidth: 100,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: '700',
        color: '#3B82F6',
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 4,
        borderBottomWidth: 1,
    },
    scheduleRegistration: {
        padding: 20,
    },
    scheduleTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        marginBottom: 20,
        textAlign: 'center',
    },
    daysContainer: {
        marginBottom: 20,
    },
    daySection: {
        marginBottom: 10,
    },
    dayButton: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    dayButtonActive: {
        backgroundColor: '#e3f2fd',
        borderColor: '#3B82F6',
    },
    dayButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    dayButtonTextActive: {
        fontWeight: '700',
        color: '#3B82F6',
    },
    dayButtonRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dayCountBadge: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    dayCountText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    timeSlots: {
        marginTop: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 10,
    },
    timeSlotsScroll: {
        maxHeight: 300,
    },
    timeSlot: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    timeSlotSelected: {
        backgroundColor: '#5B99F7',
    },
    timeSlotText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        textAlign: 'center',
    },
    timeSlotTextSelected: {
        color: 'white',
        fontWeight: '700',
    },
    timeSlotOnce: {
        backgroundColor: 'rgba(91, 153, 247, 0.3)',
        borderWidth: 2,
        borderColor: '#5B99F7',
    },
    timeSlotRecurring: {
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 2,
        borderColor: '#8B5CF6',
    },
    timeSlotContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
    },
    timeSlotStateOptions: {
        flexDirection: 'row',
        gap: 6,
        marginLeft: 12,
    },
    stateOptionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        backgroundColor: '#f8f9fa',
        borderWidth: 1.5,
        borderColor: '#e9ecef',
    },
    stateOptionActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        shadowColor: '#3B82F6',
        shadowOpacity: 0.4,
        shadowRadius: 4,
        shadowOffset: {width: 0, height: 2},
    },
    stateOptionActiveRecurring: {
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6',
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.4,
        shadowRadius: 4,
        shadowOffset: {width: 0, height: 2},
    },
    stateOptionText: {
        color: '#999',
        fontSize: 11,
        fontWeight: '700',
    },
    stateOptionTextActive: {
        color: 'white',
    },
    timeSlotIndicator: {
        backgroundColor: '#5B99F7',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginLeft: 8,
    },
    timeSlotIndicatorRecurring: {
        backgroundColor: '#8B5CF6',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginLeft: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeSlotIndicatorText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
    },
    submitButton: {
        backgroundColor: '#5B99F7',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    scheduleHeader: {
        paddingTop: 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
        position: 'relative',
    },
    scheduleBackButton: {
        position: 'absolute',
        left: 20,
        top: 40,
        padding: 4,
        zIndex: 1,
    },
    schedulePageTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    scheduleSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    scheduleScrollView: {
        flex: 1,
    },
    daysFullContainer: {
        padding: 20,
    },
    dayFullSection: {
        marginBottom: 12,
    },
    dayFullButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 14,
        paddingHorizontal: 20,
        paddingVertical: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    dayFullButtonActive: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderColor: 'rgba(255,255,255,0.3)',
    },
    dayFullButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
    },
    timeFullSlots: {
        marginTop: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
    },
    timeFullSlotsScroll: {
        maxHeight: 350,
    },
    timeFullSlot: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginBottom: 8,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    timeFullSlotSelected: {
        backgroundColor: '#5B99F7',
        borderColor: 'white',
    },
    timeFullSlotText: {
        color: '#666',
        fontSize: 15,
        textAlign: 'center',
    },
    timeFullSlotTextSelected: {
        color: 'white',
        fontWeight: '700',
    },
    scheduleBottomBar: {
        padding: 20,
        paddingBottom: 30,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    scheduleSubmitButton: {
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
    },
    scheduleSubmitButtonActive: {
        backgroundColor: '#3B82F6',
    },
    scheduleSubmitButtonDisabled: {
        backgroundColor: '#E0E0E0',
    },
    scheduleSubmitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    readyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    readyStateTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginTop: 20,
        marginBottom: 8,
    },
    readyStateSubtitle: {
        fontSize: 16,
        color: '#666',
    },
    readyStateActions: {
        marginTop: 40,
        width: '100%',
        paddingHorizontal: 20,
    },
    scheduleButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    modifyScheduleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 8,
    },
    modifyScheduleButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    unreadyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 8,
    },
    unreadyButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    schedulePreview: {
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
    },
    schedulePreviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    schedulePreviewTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E40AF',
    },
    schedulePreviewDay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E7FF',
    },
    schedulePreviewDayName: {
        fontSize: 14,
        color: '#1E40AF',
        fontWeight: '700',
    },
    schedulePreviewTimes: {
        fontSize: 12,
        color: '#64748B',
    },
    timePeriodSection: {
        marginBottom: 20,
    },
    timePeriodLabel: {
        color: '#333',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        marginLeft: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: '#e9ecef',
        alignSelf: 'flex-start',
        borderRadius: 6,
    },
    helpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
        gap: 24,
    },
    helpItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    helpIndicator: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    helpIndicatorText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
    helpText: {
        color: '#666',
        fontSize: 12,
    },
    timeSlotInnerContent: {
        flex: 1,
    },
    timeSlotStateIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 8,
    },
    stateIndicatorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    stateIndicatorActive: {
        backgroundColor: '#5B99F7',
        borderColor: '#5B99F7',
    },
    stateIndicatorActiveRecurring: {
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6',
    },
    stateIndicatorText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '700',
    },
    stateIndicatorTextActive: {
        color: 'white',
    },
    // Schedule detail view styles
    scheduleDetailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    scheduleDetailBackButton: {
        padding: 4,
    },
    scheduleDetailTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    scheduleCalendarContainer: {
        flex: 1,
        marginHorizontal: 16,
        marginTop: 16,
    },
    calendarHeader: {
        flexDirection: 'row',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        marginBottom: 8,
    },
    timeColumnHeader: {
        width: 60,
    },
    dayColumnHeader: {
        flex: 1,
        alignItems: 'center',
    },
    dayColumnText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '700',
    },
    dayColumnBadge: {
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    dayColumnBadgeText: {
        color: '#3B82F6',
        fontSize: 10,
        fontWeight: '700',
    },
    calendarBody: {
        flex: 1,
    },
    timeRow: {
        flexDirection: 'row',
        height: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FAFAFA',
    },
    timeRowPM: {
        backgroundColor: '#F0F7FF',
    },
    timeLabel: {
        width: 60,
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 8,
    },
    timeLabelPM: {
        backgroundColor: '#E8F2FF',
    },
    timeLabelPeriod: {
        color: '#666',
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 2,
    },
    timeLabelText: {
        color: '#333',
        fontSize: 12,
        fontWeight: '700',
    },
    timeCell: {
        flex: 1,
        borderLeftWidth: 1,
        borderLeftColor: '#F3F4F6',
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeCellPM: {
        backgroundColor: '#F8FBFF',
    },
    timeCellOnce: {
        backgroundColor: '#3B82F6',
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    timeCellRecurring: {
        backgroundColor: '#8B5CF6',
        borderWidth: 1,
        borderColor: '#8B5CF6',
    },
    timeCellIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    calendarLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 24,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        backgroundColor: '#F8FAFC',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendColor: {
        width: 16,
        height: 16,
        borderRadius: 4,
    },
    legendText: {
        color: '#6B7280',
        fontSize: 12,
    },
    memberRequestsContainer: {
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
    },
    memberRequestsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        marginBottom: 12,
    },
    memberRequestCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        width: 200,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    memberRequestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    memberRequestName: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    memberRequestBadge: {
        backgroundColor: 'rgba(91, 153, 247, 0.3)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: '#5B99F7',
    },
    memberRequestBadgeText: {
        fontSize: 10,
        color: 'white',
        fontWeight: '700',
    },
    memberRequestSubtext: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 12,
    },
    memberRequestActions: {
        flexDirection: 'row',
        gap: 8,
    },
    memberRequestAccept: {
        flex: 1,
        backgroundColor: '#5B99F7',
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center',
    },
    memberRequestAcceptText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    memberRequestReject: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    memberRequestRejectText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '700',
    },
    autoScheduleButtonContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    autoScheduleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E40AF',
        borderRadius: 14,
        paddingVertical: 18,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    autoScheduleButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    scheduledStateContainer: {
        padding: 20,
        gap: 16,
    },
    scheduledStateCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    scheduledStateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    scheduledStateTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    scheduledStateMessage: {
        fontSize: 16,
        lineHeight: 24,
        color: '#4B5563',
        marginBottom: 8,
    },
    scheduledStateSubMessage: {
        fontSize: 14,
        lineHeight: 20,
        color: '#6B7280',
        marginBottom: 16,
    },
    scheduledStateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    scheduledStateInfoText: {
        fontSize: 13,
        color: '#6B7280',
    },
    contactTrainerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 8,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    contactTrainerButtonText: {
        color: '#3B82F6',
        fontSize: 16,
        fontWeight: '700',
    },
    viewScheduleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 14,
        paddingVertical: 18,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    trainingScheduleInfo: {
        marginTop: 12,
    },
    trainingInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        fontWeight: '700',
        gap: 8,
        marginBottom: 8,
    },
    trainingInfoText: {
        fontSize: 14,
        color: '#475569',
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        marginVertical: 20,
        gap: 12,
        borderWidth: 2,
        borderColor: '#3B82F6',
        shadowColor: '#3B82F6',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchButtonText: {
        color: '#3B82F6',
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    infoText: {
        color: '#1E40AF',
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
    },
});
