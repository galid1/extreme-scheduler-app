import React, {useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useTrainingStore, TrainingSession} from '@/src/store/useTrainingStore';
import WeekNavigator from '@/src/components/training/WeekNavigator';
import WeekCalendarView, {WeekCalendarViewRef} from '@/src/components/training/WeekCalendarView';
import {AutoSchedulingResultStatus, trainerScheduleService, memberScheduleService} from '@/src/services/api';
import {getCurrentWeek} from '@/src/utils/dateUtils';
import {useAuthStore} from '@/src/store/useAuthStore';
import {AccountType} from '@/src/types/enums';
import {useSchedulingEventStore} from '@/src/store/useSchedulingEventStore';
import TrainerScheduleActions from '@/src/components/training/TrainerScheduleActions';
import MemberScheduleActions from '@/src/components/training/MemberScheduleActions';
import TrainerCancelRequestsSection from '@/src/components/training/TrainerCancelRequestsSection';
import MemberCancelRequestsSection from '@/src/components/training/MemberCancelRequestsSection';
import {CancelRequestDetailResponse} from '@/src/types/api';


export default function TrainingScheduleScreen() {
    const router = useRouter();
    const {account} = useAuthStore();
    const {
        trainingSessions,
        currentWeek,
        totalWeeks,
        selectedMember,
        setTrainingSessions,
        setCurrentWeek,
        setSelectedMember,
        getSessionsForWeek: storeGetSessionsForWeek,
        isCurrentWeek,
        isPastWeek,
        isNextWeek,
    } = useTrainingStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isFixingWeekSchedule, setIsFixingWeekSchedule] = useState(false);
    const [currentTime] = useState(new Date());
    const [currentWeekAutoSchedulingStatus, setCurrentWeekAutoSchedulingStatus] = useState<AutoSchedulingResultStatus | undefined>(undefined);
    const [nextWeekAutoSchedulingStatus, setNextWeekAutoSchedulingStatus] = useState<AutoSchedulingResultStatus | undefined>(undefined);
    const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
    const [cancelRequests, setCancelRequests] = useState<CancelRequestDetailResponse[]>([]);
    const calendarViewRef = useRef<WeekCalendarViewRef>(null);

    useEffect(() => {
        // Store에 이미 주차가 설정되어 있으면 그대로 사용 (auto-scheduling에서 설정한 경우)
        // 설정되어 있지 않거나 0이면 현재 실제 주차로 초기화
        console.log('🔍 TrainingSchedule mounted, currentWeek:', currentWeek);
        if (!currentWeek || currentWeek === 0) {
            const realCurrentWeek = getCurrentWeek();
            console.log('📍 Setting currentWeek to realCurrentWeek:', realCurrentWeek);
            setCurrentWeek(realCurrentWeek);
        } else {
            console.log('✅ Using existing currentWeek:', currentWeek);
        }

        fetchTrainingSessions();
    }, []);

    // 가장 가까운 세션 찾기 및 자동 포커스
    useEffect(() => {
        if (!isLoading && trainingSessions.length > 0) {
            const weekSessions = storeGetSessionsForWeek(currentWeek);
            if (weekSessions.length === 0) return;

            const today = new Date();
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            const daysSinceStart = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
            const realCurrentWeek = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);

            const dayOrder = ['일', '월', '화', '수', '목', '금', '토'];
            const currentDay = dayOrder[today.getDay()];
            const currentHour = today.getHours();

            let targetSession = null;

            if (currentWeek === realCurrentWeek) {
                // 현재 주차: 현재 시간 이후의 가장 가까운 세션
                const upcomingSessions = weekSessions.filter(session => {
                    const dayIndex = dayOrder.indexOf(session.day);
                    const currentDayIndex = dayOrder.indexOf(currentDay);

                    if (dayIndex > currentDayIndex) return true;
                    if (dayIndex === currentDayIndex && session.hour > currentHour) return true;
                    return false;
                });

                // 시간순으로 정렬
                upcomingSessions.sort((a, b) => {
                    const aDayIndex = dayOrder.indexOf(a.day);
                    const bDayIndex = dayOrder.indexOf(b.day);

                    if (aDayIndex !== bDayIndex) {
                        return aDayIndex - bDayIndex;
                    }
                    return a.hour - b.hour;
                });

                if (upcomingSessions.length > 0) {
                    targetSession = upcomingSessions[0];
                }
            } else if (currentWeek > realCurrentWeek) {
                // 미래 주차: 주차의 첫 번째 세션
                const sortedSessions = [...weekSessions].sort((a, b) => {
                    const aDayIndex = dayOrder.indexOf(a.day);
                    const bDayIndex = dayOrder.indexOf(b.day);

                    if (aDayIndex !== bDayIndex) {
                        return aDayIndex - bDayIndex;
                    }
                    return a.hour - b.hour;
                });

                if (sortedSessions.length > 0) {
                    targetSession = sortedSessions[0];
                }
            }

            // 타겟 세션이 있으면 선택하고 스크롤
            if (targetSession) {
                console.log('Auto-focusing on session:', targetSession);
                setSelectedMember(targetSession.memberId);

                // 캘린더 뷰 스크롤
                setTimeout(() => {
                    calendarViewRef.current?.scrollToHour(targetSession.hour);
                }, 800);
            } else if (currentWeek === realCurrentWeek) {
                // 현재 주차이면서 남은 세션이 없으면 현재 시간으로 스크롤
                setTimeout(() => {
                    calendarViewRef.current?.scrollToHour(currentHour);
                }, 800);
            }
        }
    }, [isLoading, trainingSessions, currentWeek, storeGetSessionsForWeek, setSelectedMember]);

    // getSessionsForWeek 함수를 로컬에 정의 (store 함수를 래핑)
    const getSessionsForWeek = (week: number) => {
        return storeGetSessionsForWeek(week);
    };

    // 취소 요청 데이터 가져오기
    const fetchCancelRequests = async () => {
        try {
            const today = new Date();
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            const daysSinceStart = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
            const realCurrentWeek = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);

            if (account?.accountType === AccountType.TRAINER) {
                // 트레이너: 현재 주차와 다음 주차의 취소 요청 가져오기
                const currentWeekRequests = await trainerScheduleService.getCancelRequests(
                    today.getFullYear(),
                    realCurrentWeek
                );
                const nextWeekRequests = await trainerScheduleService.getCancelRequests(
                    today.getFullYear(),
                    realCurrentWeek + 1
                );

                // 두 주차의 요청을 합쳐서 저장
                const allRequests = [
                    ...currentWeekRequests.cancelRequests,
                    ...nextWeekRequests.cancelRequests
                ];

                setCancelRequests(allRequests);
            } else if (account?.accountType === AccountType.MEMBER) {
                // 회원: 현재 주차와 다음 주차의 취소 요청 가져오기
                const currentWeekRequests = await memberScheduleService.getCancelRequests(
                    today.getFullYear(),
                    realCurrentWeek
                );
                const nextWeekRequests = await memberScheduleService.getCancelRequests(
                    today.getFullYear(),
                    realCurrentWeek + 1
                );

                // 두 주차의 요청을 합쳐서 저장 (CancelRequestResponse를 CancelRequestDetailResponse 형식으로 변환)
                const allRequests = [...currentWeekRequests, ...nextWeekRequests].map(req => ({
                    ...req,
                    memberAccountId: account.id,
                    memberName: account.privacyInfo?.name || '',
                } as CancelRequestDetailResponse));

                setCancelRequests(allRequests);
            }
        } catch (error) {
            console.error('Error fetching cancel requests:', error);
        }
    };

    const fetchTrainingSessions = async () => {
        setIsLoading(true);
        try {
            // 현재 주차 계산
            const today = new Date();
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            const daysSinceStart = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
            const realCurrentWeek = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);

            // 이번주와 다음주 데이터 가져오기
            let currentWeekResponse;
            let nextWeekResponse;

            if (account?.accountType === AccountType.TRAINER) {
                // 트레이너: 기존 API 사용
                currentWeekResponse = await trainerScheduleService.getAutoSchedulingResult(
                    currentTime.getFullYear(),
                    realCurrentWeek
                );
                nextWeekResponse = await trainerScheduleService.getAutoSchedulingResult(
                    currentTime.getFullYear(),
                    realCurrentWeek + 1
                );

                // Store the status for both weeks
                setCurrentWeekAutoSchedulingStatus(currentWeekResponse.weeklyAutoSchedulingResultStatus)
                setNextWeekAutoSchedulingStatus(nextWeekResponse.weeklyAutoSchedulingResultStatus)
            } else {
                // 회원: memberScheduleService 사용 (배열을 scheduleList로 감싸기)
                const currentWeekData = await memberScheduleService.getFixedAutoSchedulingResult(
                    currentTime.getFullYear(),
                    realCurrentWeek
                );
                const nextWeekData = await memberScheduleService.getFixedAutoSchedulingResult(
                    currentTime.getFullYear(),
                    realCurrentWeek + 1
                );

                currentWeekResponse = {scheduleList: currentWeekData};
                nextWeekResponse = {scheduleList: nextWeekData};
                // Members don't have status info, so leave as undefined
            }

            // 요일 매핑 (DayOfWeek enum -> 한글)
            const dayOfWeekMap: { [key: string]: string } = {
                'MONDAY': '월',
                'TUESDAY': '화',
                'WEDNESDAY': '수',
                'THURSDAY': '목',
                'FRIDAY': '금',
                'SATURDAY': '토',
                'SUNDAY': '일'
            };

            // API 응답을 TrainingSession 형식으로 변환
            const convertToTrainingSessions = (schedules: any[], weekOfYear: number) => {
                const sessions: any[] = [];

                schedules.forEach(schedule => {
                    const day = dayOfWeekMap[schedule.dayOfWeek] || schedule.dayOfWeek;

                    // startHour부터 endHour까지 각 시간대별로 세션 생성
                    for (let hour = schedule.startHour; hour < schedule.endHour; hour++) {
                        sessions.push({
                            memberId: schedule.memberAccountId.toString(),
                            memberName: schedule.memberName,
                            memberPhone: '', // API 응답에 없으면 빈 문자열
                            hour: hour,
                            day: day,
                            weekOfYear: weekOfYear,
                            autoSchedulingResultLineId: schedule.autoSchedulingResultLineId // Include ID for cancellation
                        });
                    }
                });

                return sessions;
            };

            const currentWeekSessions = convertToTrainingSessions(
                currentWeekResponse.scheduleList || [],
                realCurrentWeek
            );
            const nextWeekSessions = convertToTrainingSessions(
                nextWeekResponse.scheduleList || [],
                realCurrentWeek + 1
            );

            const allSessions = [...currentWeekSessions, ...nextWeekSessions];
            console.log(`Total sessions loaded: ${allSessions.length}`);
            setTrainingSessions(allSessions);

            // 트레이너인 경우 취소 요청도 가져오기
            await fetchCancelRequests();
        } catch (error) {
            console.error('Error fetching training sessions:', error);
            Alert.alert('오류', '스케줄을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6"/>
                    <Text style={styles.loadingText}>트레이닝 일정을 불러오는 중...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Get unique members for current week
    const weekSessions = getSessionsForWeek(currentWeek);

    // Get today's sessions only
    const getTodaySessions = () => {
        const dayOrder = ['일', '월', '화', '수', '목', '금', '토'];
        const currentDay = dayOrder[currentTime.getDay()];
        const currentHour = currentTime.getHours();
        const weekSessions = getSessionsForWeek(currentWeek);

        // Filter sessions for today only
        const todaySessions = weekSessions.filter(session => {
            // Only show today's sessions if this is the current week
            if (isCurrentWeek(currentWeek)) {
                return session.day === currentDay;
            }
            // For future weeks, don't show any sessions in "오늘 일정"
            return false;
        });

        // Sort by hour
        const sortedSessions = [...todaySessions].sort((a, b) => a.hour - b.hour);

        // If current week, filter out past sessions
        if (isCurrentWeek(currentWeek)) {
            return sortedSessions.filter(session => session.hour > currentHour);
        }

        return sortedSessions;
    };

    const todaySessions = getTodaySessions();

    // Helper to get scheduling status for the currently viewing week
    const getCurrentViewingWeekStatus = (): AutoSchedulingResultStatus | undefined => {
        const realCurrentWeek = getCurrentWeek();
        if (currentWeek === realCurrentWeek) {
            return currentWeekAutoSchedulingStatus;
        } else if (currentWeek === realCurrentWeek + 1) {
            return nextWeekAutoSchedulingStatus;
        }
        // For other weeks, we don't have status info
        return undefined;
    };

    const currentViewingWeekStatus = getCurrentViewingWeekStatus();

    // Check if schedule is already fixed
    const isAlreadyFixed = currentViewingWeekStatus === AutoSchedulingResultStatus.FIXED;

    return (
        <SafeAreaView style={styles.container}>
            {/* Week Navigator */}
            <WeekNavigator
                currentWeek={currentWeek}
                totalWeeks={totalWeeks}
                onWeekChange={setCurrentWeek}
                isCurrentWeek={isCurrentWeek(currentWeek)}
                isPastWeek={isPastWeek(currentWeek)}
                isNextWeek={isNextWeek(currentWeek)}
                onBack={() => {
                    // router.back()이 실패하면 홈으로 이동
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/(tabs)');
                    }
                }}
            />

            {/* Cancel Requests Section - Only show for trainers */}
            {account?.accountType === AccountType.TRAINER && (
                <TrainerCancelRequestsSection
                    requests={cancelRequests}
                    onRequestProcessed={() => {
                        // 요청 처리 후 데이터 다시 로드
                        fetchCancelRequests();
                        fetchTrainingSessions();
                    }}
                />
            )}

            {/* Cancel Requests Section - Only show for members */}
            {account?.accountType === AccountType.MEMBER && cancelRequests.length > 0 && (
                <MemberCancelRequestsSection requests={cancelRequests} />
            )}

            {/* Upcoming Sessions - Only show for current week */}
            {isCurrentWeek(currentWeek) && (
                <View style={styles.upcomingSection}>
                    <View style={styles.upcomingHeader}>
                        <Text style={styles.upcomingTitle}>오늘 일정</Text>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.upcomingScrollContent}
                    >
                        {todaySessions.length > 0 ? (
                            todaySessions.map((session, idx) => {
                                const displayHour = session.hour === 0 ? 12 : session.hour > 12 ? session.hour - 12 : session.hour;
                                const period = session.hour < 12 ? '오전' : '오후';
                                const isNext = idx === 0;

                                // Calculate date for the session considering week difference
                                const dayOrder = ['일', '월', '화', '수', '목', '금', '토'];
                                const currentDate = new Date();
                                const currentDayIndex = currentDate.getDay();
                                const currentHour = currentDate.getHours();
                                const sessionDayIndex = dayOrder.indexOf(session.day);

                                // Get current week of year
                                const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
                                const daysSinceStart = Math.floor((currentDate - startOfYear) / (24 * 60 * 60 * 1000));
                                const currentWeekOfYear = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);

                                // Calculate week difference
                                const weekDiff = session.weekOfYear - currentWeekOfYear;

                                // Calculate days to add considering week difference
                                let daysToAdd = (sessionDayIndex - currentDayIndex + 7) % 7;
                                if (weekDiff > 0) {
                                    daysToAdd += weekDiff * 7;
                                } else if (weekDiff === 0 && daysToAdd === 0 && session.hour <= currentHour) {
                                    // If same day but past time, it means next week
                                    daysToAdd = 7;
                                }

                                const sessionDate = new Date(currentDate);
                                sessionDate.setDate(currentDate.getDate() + daysToAdd);
                                const hoursUntil = session.hour - currentHour + (daysToAdd * 24);

                                return (
                                    <TouchableOpacity
                                        key={`${session.memberId}-${session.day}-${session.hour}`}
                                        style={styles.cardWrapper}
                                        onPress={() => {
                                            setSelectedMember(session.memberId);
                                            // Scroll to the member's session hour in calendar
                                            calendarViewRef.current?.scrollToHour(session.hour);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        {isNext && (
                                            <View style={styles.nextBadgeTop}>
                                                <Ionicons name="arrow-forward-circle" size={14} color="white"/>
                                                <Text style={styles.nextBadgeTopText}>다음 수업</Text>
                                            </View>
                                        )}
                                        <View
                                            style={[styles.upcomingCard, isNext && styles.nextCard, selectedMember === session.memberId && styles.selectedUpcomingCard]}>
                                            <View style={styles.upcomingTimeInfo}>
                                                <View style={styles.upcomingMemberInfo}>
                                                    <Ionicons
                                                        name="person-circle"
                                                        size={24}
                                                        color={isNext ? "white" : "#3B82F6"}
                                                    />
                                                    <Text
                                                        style={[styles.upcomingMemberName, isNext && styles.nextText]}>
                                                        {session.memberName}
                                                    </Text>
                                                </View>

                                                <View style={styles.upcomingDayRow}>
                                                    <View style={styles.nextDayRow}>
                                                        <Text
                                                            style={[styles.upcomingHoursUntil, isNext && styles.nextTimeText]}>
                                                            {session.hour - currentHour}시간 후
                                                        </Text>
                                                    </View>
                                                </View>

                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <Text style={styles.noUpcomingText}>오늘 남은 일정이 없습니다</Text>
                        )}
                    </ScrollView>
                </View>
            )}

            {/* Calendar View */}
            <View style={styles.calendarContainer}>
                <WeekCalendarView
                    ref={calendarViewRef}
                    sessions={trainingSessions}
                    selectedMember={selectedMember}
                    selectedSession={selectedSession}
                    onSelectMember={setSelectedMember}
                    onSelectSession={setSelectedSession}
                    currentWeek={currentWeek}
                    onWeekChange={setCurrentWeek}
                />
            </View>

            {/* Trainer Schedule Actions - Only show for trainers and next week */}
            {account?.accountType === AccountType.TRAINER && (
                <TrainerScheduleActions
                    currentWeek={currentWeek}
                    isNextWeek={isNextWeek}
                    isPastWeek={isPastWeek}
                    isCurrentWeek={isCurrentWeek}
                    isAlreadyFixed={isAlreadyFixed}
                    isFixingWeekSchedule={isFixingWeekSchedule}
                    setIsFixingWeekSchedule={setIsFixingWeekSchedule}
                    setNextWeekAutoSchedulingStatus={setNextWeekAutoSchedulingStatus}
                />
            )}

            {/* Member Schedule Actions - Only show for members */}
            {account?.accountType === AccountType.MEMBER && (
                <MemberScheduleActions
                    selectedSession={selectedSession}
                    currentAccountId={account?.id}
                />
            )}

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
    membersSummary: {
        paddingVertical: 16,
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    membersScroll: {
        paddingHorizontal: 12,
    },
    memberCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 8,
        marginHorizontal: 3,
        alignItems: 'center',
        minWidth: 75,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    memberCardSelected: {
        backgroundColor: 'rgba(91, 153, 247, 0.3)',
        borderColor: '#5B99F7',
        borderWidth: 2,
    },
    memberAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    memberName: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
    },
    sessionTimesList: {
        alignItems: 'center',
    },
    sessionTime: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 9,
        marginBottom: 1,
    },
    upcomingSection: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    upcomingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    nextBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    nextBadgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
    },
    upcomingTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    upcomingScrollContent: {
        paddingHorizontal: 16,
        gap: 12,
        paddingTop: 5,
    },
    cardWrapper: {
        width: 130,
        marginTop: 12,
    },
    nextBadgeTop: {
        position: 'absolute',
        top: -12,
        left: '50%',
        transform: [{translateX: -35}],
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 3,
        zIndex: 10,
        elevation: 5,
    },
    nextBadgeTopText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
    upcomingCard: {
        backgroundColor: '#F0F7FF',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        width: 130,
    },
    selectedUpcomingCard: {
        borderColor: '#10B981',
        borderWidth: 2,
    },
    nextCard: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    upcomingTimeInfo: {
        marginBottom: 2,
    },
    upcomingDayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    nextDayRow: {
        padding: 5,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    upcomingDate: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    upcomingHoursUntil: {
        fontSize: 10,
        fontWeight: '700',
    },
    upcomingDay: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    upcomingTime: {
        fontSize: 12,
        fontWeight: '700',
        color: '#333',
    },
    upcomingMemberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    upcomingMemberName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#333',
    },
    nextText: {
        color: 'white',
    },
    nextTimeText: {
        color: 'yellow',
        fontWeight: '700',
    },
    noUpcomingText: {
        color: '#666',
        fontSize: 14,
        fontStyle: 'italic',
    },
    calendarContainer: {
        flex: 1,
        marginBottom: 16,
    },
    calendarHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 8,
        marginBottom: 8,
    },
    timeColumn: {
        width: 60,
    },
    dayHeader: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 10,
    },
    dayHeaderText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '700',
    },
    calendarBody: {
        flex: 1,
    },
    hourRow: {
        flexDirection: 'row',
        height: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FAFAFA',
    },
    hourRowPM: {
        backgroundColor: '#F0F7FF',
    },
    timeCell: {
        width: 60,
        justifyContent: 'center',
        paddingRight: 8,
        alignItems: 'center',
    },
    timeCellPM: {
        backgroundColor: '#E8F2FF',
    },
    periodText: {
        color: '#666',
        fontSize: 10,
        fontWeight: '600',
    },
    timeText: {
        color: '#333',
        fontSize: 12,
        fontWeight: '700',
    },
    dayCell: {
        flex: 1,
        borderLeftWidth: 1,
        borderLeftColor: '#F3F4F6',
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayCellPM: {
        backgroundColor: '#F8FBFF',
    },
    dayCellWithSession: {
        backgroundColor: '#3B82F6',
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    dayCellSelectedMember: {
        backgroundColor: '#3B82F6',
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    dayCellOtherMember: {
        backgroundColor: '#E5E7EB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    sessionMemberName: {
        color: 'white',
        fontSize: 11,
        fontWeight: '600',
    },
});
