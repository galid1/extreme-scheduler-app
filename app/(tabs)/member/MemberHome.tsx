import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, AppState, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {useAuthStore} from '@/src/store/useAuthStore';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {authService, memberScheduleService, memberService} from '@/src/services/api';
import type {OnetimeScheduleLine, PeriodicScheduleLine} from '@/src/types/api';
import MockModeToggle from '@/src/components/MockModeToggle';
import {useConfigStore} from '@/src/store/useConfigStore';
import {getYearAndWeek} from '@/src/utils/dateUtils';
import TrainerSearchComponent from '@/src/components/member/TrainerSearchComponent';
import FreeTimeScheduleEditor from '@/src/components/freetimeschedule/FreeTimeScheduleEditor';


export default function MemberHome() {
    const router = useRouter();
    const {
        account,
        member,
        setTrainerAccountId,
        savedSchedule,
        setSavedSchedule,
        setAccountData,
        setAssignedTrainer,
        autoSchedulingResults,
        setAutoSchedulingResults,
        weeklyScheduleRegistration,
        setWeeklyScheduleRegistration
    } = useAuthStore();
    const name = account?.privacyInfo?.name;
    const trainerAccountId = member?.trainerAccountId;

    // Helper function to check if auto scheduling is completed with results
    const hasAutoSchedulingResults = useCallback(() => {
        return autoSchedulingResults !== null && autoSchedulingResults?.length > 0;
    }, [autoSchedulingResults]);
    const appStateRef = useRef(AppState.currentState);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);
    const [showScheduleEdit, setShowScheduleEdit] = useState(false);
    const [showScheduleDetail, setShowScheduleDetail] = useState(false);
    const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
    const [scheduleData, setScheduleData] = useState<{
        periodicScheduleLines: PeriodicScheduleLine[],
        onetimeScheduleLines: OnetimeScheduleLine[]
    }>({periodicScheduleLines: [], onetimeScheduleLines: []});
    const {mockMode} = useConfigStore();

    // Fetch member's free time schedule
    const fetchMemberSchedule = useCallback(async () => {
        if (!member || mockMode) {
            setScheduleData({periodicScheduleLines: [], onetimeScheduleLines: []});
            return;
        }

        try {
            const response = await memberScheduleService.getFreeSchedule();
            setScheduleData({
                periodicScheduleLines: response.periodicScheduleLines,
                onetimeScheduleLines: response.onetimeScheduleLines,
            });
        } catch (error) {
            console.error('Error fetching member schedule:', error);
            setScheduleData({periodicScheduleLines: [], onetimeScheduleLines: []});
        }
    }, [member, mockMode]);

    // Fetch schedule data when needed
    useEffect(() => {
        if (showScheduleEdit || (weeklyScheduleRegistration?.registered === false)) {
            fetchMemberSchedule();
        }
    }, [showScheduleEdit, weeklyScheduleRegistration, fetchMemberSchedule]);

    // Fetch weekly schedule registration status
    const fetchWeeklyScheduleRegistration = useCallback(async () => {
        if (!member) {
            setWeeklyScheduleRegistration(null);
            return;
        }

        if (mockMode) {
            setWeeklyScheduleRegistration({registered: false, year: 2024, weekOfYear: 1});
            return;
        }

        try {
            const {targetYear, targetWeekOfYear} = getYearAndWeek();
            const nextWeekOfYear = targetWeekOfYear + 1; // 다음주

            const status = await memberScheduleService.checkWeeklyScheduleRegistration(
                targetYear,
                nextWeekOfYear
            );
            setWeeklyScheduleRegistration(status);
        } catch (error) {
            console.error('Error fetching weekly schedule registration:', error);
            setWeeklyScheduleRegistration(null);
        }
    }, [mockMode, member, setWeeklyScheduleRegistration]);

    // Fetch auto scheduling results
    const fetchAutoSchedulingResults = useCallback(async () => {
        if (!member) {
            setAutoSchedulingResults(null);
            return;
        }

        if (mockMode) {
            setAutoSchedulingResults([]);
            return;
        }

        try {
            const {targetYear, targetWeekOfYear} = getYearAndWeek();
            const response = await memberScheduleService.getFixedAutoSchedulingResult(
                targetYear,
                targetWeekOfYear
            );
            setAutoSchedulingResults(response.data);
        } catch (error) {
            console.error('Error fetching auto scheduling results:', error);
            setAutoSchedulingResults(null);
        }
    }, [mockMode, member, setAutoSchedulingResults]);

    // Update member status when app comes to foreground
    useEffect(() => {
        const fetchLatestUserData = async () => {
            if (account && !mockMode) {
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

                        // Fetch weekly schedule registration and auto scheduling results after updating member data
                        await fetchWeeklyScheduleRegistration();
                        await fetchAutoSchedulingResults();
                    }
                } catch (error) {
                    console.error('Error fetching latest user data:', error);
                }
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
    }, [account, fetchWeeklyScheduleRegistration, fetchAutoSchedulingResults]);

    // Fetch weekly schedule registration and auto scheduling results when status changes
    useEffect(() => {
        fetchWeeklyScheduleRegistration();
        fetchAutoSchedulingResults();
    }, [fetchWeeklyScheduleRegistration, fetchAutoSchedulingResults]);

    // Show trainer assignment UI if no trainer assigned
    if (!trainerAccountId) {
        return (
            <TrainerSearchComponent
                mockMode={mockMode}
                onAssignmentSuccess={setTrainerAccountId}
            />
        );
    }

  // Show schedule registration as full page for NOT registered status or when editing
  // Schedule editing view for members with trainer assigned
  if (trainerAccountId && (weeklyScheduleRegistration?.registered === false || showScheduleEdit)) {
    return (
      <FreeTimeScheduleEditor
                showEdit={showScheduleEdit}
                periodicScheduleLines={scheduleData.periodicScheduleLines}
                onetimeScheduleLines={scheduleData.onetimeScheduleLines}
                expandedDay={expandedDay}
                setExpandedDay={setExpandedDay}
                isSubmitting={isSubmittingSchedule}
                setIsSubmitting={setIsSubmittingSchedule}
                onCancel={() => {
                    setShowScheduleEdit(false);
                    setExpandedDay(null);
                }}
                onSuccess={async () => {
                    setShowScheduleEdit(false);
                    // Reload registration status after schedule registration
                    await fetchWeeklyScheduleRegistration();
                    await fetchMemberSchedule();
                }}
            />
        );
    }

    // Show schedule detail view when requested
    if (showScheduleDetail) {
        const days = ['월', '화', '수', '목', '금', '토', '일'];
        const hours = Array.from({length: 24}, (_, i) => i);

        return (
            <SafeAreaView style={[styles.container, {backgroundColor: 'white'}]}>
                <View style={styles.scheduleDetailHeader}>
                    <TouchableOpacity
                        style={styles.scheduleDetailBackButton}
                        onPress={() => setShowScheduleDetail(false)}
                    >
                        <Ionicons name="arrow-back" size={24} color="#3B82F6"/>
                    </TouchableOpacity>
                    <Text style={styles.scheduleDetailTitle}>등록된 일정</Text>
                    <View style={{width: 44}}/>
                </View>

                <View style={styles.scheduleCalendarContainer}>
                    {/* Days header */}
                    <View style={styles.calendarHeader}>
                        <View style={styles.timeColumnHeader}/>
                        {days.map((day) => (
                            <View key={day} style={styles.dayColumnHeader}>
                                <Text style={styles.dayColumnText}>{day}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Time grid */}
                    <ScrollView style={styles.calendarBody} showsVerticalScrollIndicator={false}>
                        {hours.map((hour) => {
                            const isPM = hour >= 12;
                            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                            const period = isPM ? '오후🌙' : '오전☀️';

                            return (
                                <View key={hour} style={[styles.timeRow, isPM && styles.timeRowPM]}>
                                    <View style={[styles.timeLabel, isPM && styles.timeLabelPM]}>
                                        <Text style={styles.timeLabelPeriod}>{period}</Text>
                                        <Text style={styles.timeLabelText}>
                                            {displayHour}시
                                        </Text>
                                    </View>
                                    {days.map((day) => {
                                        const timeSlot = savedSchedule[day]?.find(t => t.hour === hour);
                                        const state = timeSlot?.state || 'none';

                                        return (
                                            <View
                                                key={`${day}-${hour}`}
                                                style={[
                                                    styles.timeCell,
                                                    isPM && styles.timeCellPM,
                                                    state === 'once' && styles.timeCellOnce,
                                                    state === 'recurring' && styles.timeCellRecurring,
                                                ]}
                                            >
                                                {state === 'recurring' && (
                                                    <View style={styles.timeCellIndicator}>
                                                        <Ionicons name="repeat" size={12} color="white"/>
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Legend */}
                <View style={styles.calendarLegend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, {
                            backgroundColor: '#3B82F6',
                            borderWidth: 1,
                            borderColor: '#3B82F6'
                        }]}/>
                        <Text style={styles.legendText}>일회</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, {
                            backgroundColor: '#8B5CF6',
                            borderWidth: 1,
                            borderColor: '#8B5CF6'
                        }]}/>
                        <Text style={styles.legendText}>매주 반복</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Default home screen for trainers or members with assigned trainer
    return (
        <SafeAreaView style={styles.container}>
            <MockModeToggle/>
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
                {/* Show welcome or other content when schedule is registered */}
                {trainerAccountId && weeklyScheduleRegistration?.registered === true && (
                    <View style={styles.readyStateContainer}>
                        <Ionicons name="checkmark-circle" size={60} color="#5B99F7"/>
                        <Text style={styles.readyStateTitle}>일정 등록 완료</Text>
                        <Text style={styles.readyStateSubtitle}>트레이너가 확인 중입니다</Text>

                        <View style={styles.readyStateActions}>
                            {/* Display saved schedule summary */}
                            {Object.keys(savedSchedule).length > 0 && (
                                <TouchableOpacity
                                    style={styles.schedulePreview}
                                    onPress={() => setShowScheduleDetail(true)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.schedulePreviewHeader}>
                                        <Text style={styles.schedulePreviewTitle}>등록된 일정</Text>
                                        <Ionicons name="chevron-forward" size={20} color="#1E40AF"/>
                                    </View>
                                    {['월', '화', '수', '목', '금', '토', '일']
                                        .filter(day => savedSchedule[day]?.length > 0)
                                        .map((day) => (
                                            <View key={day} style={styles.schedulePreviewDay}>
                                                <Text style={styles.schedulePreviewDayName}>{day}요일</Text>
                                                <Text style={styles.schedulePreviewTimes}>
                                                    {savedSchedule[day].length}개 시간대
                                                </Text>
                                            </View>
                                        ))}
                                </TouchableOpacity>
                            )}
                            <View style={styles.scheduleButtonsContainer}>
                                <TouchableOpacity
                                    style={[styles.modifyScheduleButton, {flex: 1}]}
                                    onPress={async () => {
                                        try {
                                            // Fetch latest member data to check schedule status
                                            // Skip API call in mock mode
                                            if (mockMode) {
                                                return;
                                            }
                                            const userResponse = await authService.getCurrentUser();

                                            // Update member data in store
                                            if (userResponse.member) {
                                                setAccountData({
                                                    account: userResponse.account,
                                                    member: userResponse.member,
                                                    trainer: userResponse.trainer
                                                });
                                            }

                                            // Check if there are actual scheduled results
                                            if (hasAutoSchedulingResults()) {
                                                Alert.alert(
                                                    '일정 수정 불가',
                                                    '이미 스케줄링이 완료되었습니다. 일정을 수정할 수 없습니다.',
                                                    [{text: '확인', style: 'default'}]
                                                );
                                                return;
                                            }

                                            // Load saved schedule from store for editing
                                            setShowScheduleEdit(true);
                                        } catch (error) {
                                            console.error('Error checking schedule status:', error);
                                            Alert.alert('오류', '일정 상태 확인에 실패했습니다.');
                                        }
                                    }}
                                >
                                    <Ionicons name="create-outline" size={20} color="white"/>
                                    <Text style={styles.modifyScheduleButtonText}>일정 수정</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.unreadyButton, {flex: 1}]}
                                    onPress={async () => {
                                        try {
                                            // Fetch latest member data to check schedule status
                                            // Skip API call in mock mode
                                            if (mockMode) {
                                                return;
                                            }
                                            const userResponse = await authService.getCurrentUser();

                                            // Update member data in store
                                            if (userResponse.member) {
                                                setAccountData({
                                                    account: userResponse.account,
                                                    member: userResponse.member,
                                                    trainer: userResponse.trainer
                                                });
                                            }

                                            // Check if there are actual scheduled results
                                            if (hasAutoSchedulingResults()) {
                                                Alert.alert(
                                                    '일정 취소 불가',
                                                    '이미 스케줄링이 완료되었습니다. 일정을 취소할 수 없습니다.',
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
                                                                    const {
                                                                        targetYear,
                                                                        targetWeekOfYear
                                                                    } = getYearAndWeek();

                                                                    await memberScheduleService.unRegisterWeeklyFreeTimeSchedule({
                                                                        targetYear,
                                                                        targetWeekOfYear
                                                                    });
                                                                }
                                                                setSavedSchedule({});
                                                                Alert.alert('완료', '일정이 취소되었습니다.');
                                                            } catch (error: any) {
                                                                console.error('Unready error:', error);
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
                                    <Ionicons name="close-circle-outline" size={20} color="white"/>
                                    <Text style={styles.unreadyButtonText}>일정 취소</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Show member's scheduled state */}
                {trainerAccountId && autoSchedulingResults !== null && (
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
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
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
