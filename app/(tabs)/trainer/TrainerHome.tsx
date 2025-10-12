import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, AppState, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useAuthStore} from '@/src/store/useAuthStore';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {authService, AutoSchedulingResultStatus} from '@/src/services/api';
import {TrainerStatus} from '@/src/types/enums';
import {useConfigStore} from '@/src/store/useConfigStore';
import TrainerPendingApprovalScreen from '@/src/components/trainer/TrainerPendingApprovalScreen';
import FreeTimeScheduleDetailView from '@/src/components/freetimeschedule/FreeTimeScheduleDetailView';
import trainerScheduleService from '@/src/services/api/trainer-schedule.service';
import ErrorRetryView from '@/src/components/ErrorRetryView';
import {OnetimeScheduleLine, PeriodicScheduleLine} from '@/src/types/api';
import {useTrainingStore} from '@/src/store/useTrainingStore';
import {useSchedulingEventStore} from '@/src/store/useSchedulingEventStore';
import {getCurrentWeek, getNextWeekYearAndWeek} from '@/src/utils/dateUtils';
import WeekSelector from '@/src/components/training/WeekSelector';
import SchedulePlanningFlow from '@/src/components/training/SchedulePlanningFlow';
import WeekInfo from "@/src/components/WeekInfo";
import {useNotificationStore} from '@/src/store/useNotificationStore';

export default function TrainerHome() {
    const router = useRouter();
    const {account, trainer, setAccountData} = useAuthStore();
    const name = account?.privacyInfo?.name;
    const status = trainer?.status
    const appStateRef = useRef(AppState.currentState);
    const {shouldRefresh, hasNextWeekScheduling, setHasNextWeekScheduling} = useSchedulingEventStore();
    const {unreadCount, fetchUnreadCount} = useNotificationStore();
    const [showScheduleDetail, setShowScheduleDetail] = useState(false);
    const [showScheduleEditFromDetail, setShowScheduleEditFromDetail] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isRegisteredOperationSchedule, setIsRegisteredOperationSchedule] = useState<boolean | null>(null);
    const [nextWeekAutoSchedulingResultFixed, setNextWeekAutoSchedulingResultFixed] = useState<boolean>(false);
    const [hasError, setHasError] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [scheduleData, setScheduleData] = useState<{
        periodicScheduleLines: PeriodicScheduleLine[],
        onetimeScheduleLines: OnetimeScheduleLine[]
    }>({periodicScheduleLines: [], onetimeScheduleLines: []});
    const {resetWeek} = useTrainingStore();

    // Function to load initial data
    const loadInitialData = async () => {
        try {
            setHasError(false);
            const {targetYear, targetWeekOfYear} = getNextWeekYearAndWeek();

            // Load both APIs in parallel
            const [registrationResponse, autoSchedulingResultResponse, freeTimeScheduleResponse] = await Promise.all([
                trainerScheduleService.checkWeeklyScheduleRegistration(targetYear, targetWeekOfYear),
                trainerScheduleService.getAutoSchedulingResult(targetYear, targetWeekOfYear),
                trainerScheduleService.getFreeSchedule()
            ]);

            setIsRegisteredOperationSchedule(registrationResponse.registered);
            const hasScheduling = autoSchedulingResultResponse.weeklyAutoSchedulingResultStatus != null;
            setHasNextWeekScheduling(hasScheduling); // Store에 저장
            setNextWeekAutoSchedulingResultFixed(autoSchedulingResultResponse.weeklyAutoSchedulingResultStatus == AutoSchedulingResultStatus.FIXED)
            setScheduleData({
                periodicScheduleLines: freeTimeScheduleResponse.periodicScheduleLines,
                onetimeScheduleLines: freeTimeScheduleResponse.onetimeScheduleLines,
            });

        } catch (error) {
            console.error('Error loading initial data:', error);
            setHasError(true);
        }
    };

    // Check registration status and scheduling results on mount
    useEffect(() => {
        loadInitialData();
        // Fetch unread notification count on mount
        fetchUnreadCount();
    }, []);

    // Fetch unread notification count periodically (every 30 seconds when component is visible)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);

    // 자동 스케줄링 완료 시 데이터 새로고침
    useEffect(() => {
        if (shouldRefresh > 0) {
            console.log('🎉 Scheduling completed, refreshing data...');
            loadInitialData();
        }
    }, [shouldRefresh]);

    // Retry function
    const handleRetry = async () => {
        setIsRetrying(true);
        await loadInitialData();
        setIsRetrying(false);
    };

    // Update trainer status when app comes to foreground
    useEffect(() => {
        const fetchLatestUserData = async () => {
                try {
                    const userResponse = await authService.getCurrentUser();
                    if (userResponse.trainer) {
                        setAccountData({
                            account: userResponse.account,
                            member: userResponse.member,
                            trainer: userResponse.trainer
                        });
                    }
                    // Fetch unread notification count when app comes to foreground
                    fetchUnreadCount();
                } catch (error) {
                    console.error('Error fetching latest user data:', error);
                }
        };

        // Listen for app state changes
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (
                appStateRef.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                console.log('App has come to the foreground!');
                fetchLatestUserData();
            }
            appStateRef.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [account]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const userResponse = await authService.getCurrentUser();
            if (userResponse.trainer) {
                setAccountData({
                    account: userResponse.account,
                    member: userResponse.member,
                    trainer: userResponse.trainer
                });
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
            Alert.alert('오류', '상태 업데이트에 실패했습니다.');
        } finally {
            setIsRefreshing(false);
        }
    };

    // Show error retry view if API calls failed
    if (hasError) {
        return (
            <SafeAreaView style={styles.container}>
                <ErrorRetryView onRetry={handleRetry} isRetrying={isRetrying}/>
            </SafeAreaView>
        );
    }

    // Show pending approval screen for PENDING status
    if (status === TrainerStatus.PENDING) {
        return <TrainerPendingApprovalScreen onRefresh={handleRefresh} isRefreshing={isRefreshing}/>;
    }

    // Show schedule detail view (or edit mode from detail)
    if (showScheduleDetail || showScheduleEditFromDetail) {
        const isEditMode = showScheduleEditFromDetail;

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
            <View style={styles.topHeader}>
                <Text style={styles.welcomeText}>안녕하세요, {name}님!</Text>
                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => router.push('/notifications')}
                >
                    <Ionicons name="notifications-outline" size={24} color="#1F2937"/>
                    {unreadCount > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationBadgeText}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Show trainer dashboard or schedule management */}
                <>
                    {/* Schedule Planning Flow Card */}
                    <View style={[styles.trainerDashboard]}>
                        <View style={styles.dashBoardTitleContainer}>
                            <Text style={styles.dashboardTitle}>일정 계획</Text>
                            <View style={styles.weekInfoInline}>
                                <WeekInfo nextWeek={true}/>
                            </View>
                        </View>

                        <SchedulePlanningFlow
                            // 1단계: 운영 일정
                            isOperationScheduleRegistered={isRegisteredOperationSchedule === true}
                            onShowOperationSchedule={() => setShowScheduleDetail(true)}
                            onEditOperationSchedule={() => setShowScheduleEditFromDetail(true)}

                            // 2단계: 자동 스케줄링
                            hasAutoSchedulingResult={hasNextWeekScheduling}
                            onStartAutoScheduling={() => router.push('/auto-scheduling')}
                            onViewSchedulingResult={() => {
                                const {setCurrentWeek} = useTrainingStore.getState();
                                setCurrentWeek(getCurrentWeek() + 1); // 다음 주
                                router.push('/training-schedule');
                            }}

                            // 3단계: 일정 확정
                            isScheduleConfirmed={nextWeekAutoSchedulingResultFixed}
                            onConfirmSchedule={() => {
                                // 확정 전 스케줄 확인을 위해 training-schedule로 이동
                                const {setCurrentWeek} = useTrainingStore.getState();
                                setCurrentWeek(getCurrentWeek() + 1); // 다음 주
                                router.push('/training-schedule');
                            }}
                            onResetSchedule={async () => {
                                const currentWeek = getCurrentWeek() + 1; // 다음 주
                                const alertMessage = nextWeekAutoSchedulingResultFixed
                                    ? `${currentWeek}주차 트레이닝 일정을 재설정하시겠습니까?\n\n⚠️ 해당 주차에 배정된 모든 회원에게 일정 취소 알림이 전송됩니다.`
                                    : `${currentWeek}주차 트레이닝 일정을 재설정하시겠습니까?`;

                                Alert.alert(
                                    `${currentWeek}주차 일정 재설정`,
                                    alertMessage,
                                    [
                                        {text: '취소', style: 'cancel'},
                                        {
                                            text: '재설정',
                                            onPress: async () => {
                                                try {
                                                    const today = new Date();
                                                    const currentYear = today.getFullYear();

                                                    const result = await trainerScheduleService.cancelAutoSchedulingResult(
                                                        currentYear,
                                                        currentWeek
                                                    );

                                                    if (result.success) {
                                                        resetWeek(currentWeek);
                                                        const {triggerRefresh} = useSchedulingEventStore.getState();
                                                        triggerRefresh();

                                                        router.replace({
                                                            pathname: '/auto-scheduling',
                                                            params: {
                                                                weekToReset: currentWeek,
                                                                resetMode: true
                                                            }
                                                        });
                                                    } else {
                                                        Alert.alert('오류', '일정 재설정에 실패했습니다.');
                                                    }
                                                } catch (error) {
                                                    console.error('일정 재설정 오류:', error);
                                                    Alert.alert('오류', '일정 재설정 중 문제가 발생했습니다.');
                                                }
                                            }
                                        }
                                    ]
                                );
                            }}
                        />
                    </View>

                    {/* Training Schedule Management Card */}
                    <View style={[styles.trainerDashboard, {marginTop: 16}]}>
                        <Text style={styles.dashboardTitle}>트레이닝 일정</Text>
                        <WeekSelector
                            onViewSchedule={(weekNumber) => {
                                const {setCurrentWeek} = useTrainingStore.getState();
                                setCurrentWeek(weekNumber);
                                router.push('/training-schedule');
                            }}
                        />
                    </View>
                </>
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
        paddingTop: 0,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 30,
        marginTop: 20,
    },
    welcomeText: {
        fontSize: 22,
        color: '#333',
        fontWeight: '700',
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: '500',
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
        fontWeight: '600',
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
        fontWeight: '600',
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
        borderWidth: 2,
        borderColor: '#F8FAFC',
    },
    notificationBadgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
    },
    trainerScheduleContainer: {
        padding: 20,
    },
    trainerDashboard: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginTop: 20,
        padding: 20,
        paddingBottom: 5,
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
    dashBoardTitleContainer: {
       flexDirection: "row",
       alignItems: 'center',
       marginBottom: 8,
    },
    dashboardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    weekInfoInline: {
        marginLeft: 10,
    },
    weekInfoText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    scheduleRegistration: {
        padding: 20,
    },
    scheduleTitle: {
        fontSize: 20,
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: '600',
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
        color: '#cbd5e1',
        fontSize: 11,
        fontWeight: '700',
    },
    stateOptionTextActive: {
        color: 'white',
        fontWeight: '700',
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
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: '500',
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
        fontWeight: '600',
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
        fontWeight: '600',
    },
    readyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    readyStateTitle: {
        fontSize: 22,
        fontWeight: '600',
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
        paddingVertical: 12,
        gap: 8,
    },
    modifyScheduleButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: '600',
    },
    schedulePreviewTimes: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    timePeriodSection: {
        marginBottom: 20,
    },
    timePeriodLabel: {
        color: '#333',
        fontSize: 12,
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: '500',
        marginBottom: 2,
    },
    timeLabelText: {
        color: '#333',
        fontSize: 12,
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: '600',
    },
    bottomActionsContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        flexDirection: 'column',
        gap: 12,
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
        fontWeight: '600',
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
        fontWeight: '600',
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
        fontWeight: '600',
    },
    trainingScheduleInfo: {
        marginTop: 12,
    },
    trainingInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        fontWeight: '600',
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
        fontWeight: '600',
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
    pendingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    pendingCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        maxWidth: 400,
        width: '100%',
    },
    pendingTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 20,
        marginBottom: 12,
    },
    pendingMessage: {
        fontSize: 16,
        lineHeight: 24,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 8,
    },
    pendingSubMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        gap: 8,
        minWidth: 120,
    },
    refreshButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    pendingInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    pendingInfoText: {
        fontSize: 13,
        color: '#6B7280',
    },
});
