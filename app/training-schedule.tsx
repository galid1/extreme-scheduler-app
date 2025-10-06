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
import {useTrainingStore} from '@/src/store/useTrainingStore';
import WeekNavigator from '@/src/components/training/WeekNavigator';
import WeekCalendarView from '@/src/components/training/WeekCalendarView';
import {useConfigStore} from '@/src/store/useConfigStore';
import {AutoSchedulingResultStatus, trainerScheduleService} from '@/src/services/api';


export default function TrainingScheduleScreen() {
    const router = useRouter();
    const {mockMode} = useConfigStore();
    const {
        trainingSessions,
        currentWeek,
        totalWeeks,
        selectedMember,
        weekScheduleStatus,
        setTrainingSessions,
        setCurrentWeek,
        setSelectedMember,
        setWeekScheduleStatus,
        getSessionsForWeek: storeGetSessionsForWeek,
        canSendNotification,
        isCurrentWeek,
        isPastWeek,
        isNextWeek,
        resetWeek,
    } = useTrainingStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isFixingWeekSchedule, setIsFixingWeekSchedule] = useState(false);
    const [currentTime] = useState(new Date());
    const calendarScrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        // 화면 진입 시 항상 현재 실제 주차로 초기화
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const daysSinceStart = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
        const realCurrentWeek = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
        setCurrentWeek(realCurrentWeek);

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
                    if (calendarScrollRef.current) {
                        const scrollY = Math.max(0, (targetSession.hour - 1) * 50); // 50 is hourRow height
                        calendarScrollRef.current.scrollTo({y: scrollY, animated: true});
                    }
                }, 800);
            } else if (currentWeek === realCurrentWeek) {
                // 현재 주차이면서 남은 세션이 없으면 현재 시간으로 스크롤
                setTimeout(() => {
                    if (calendarScrollRef.current) {
                        const scrollY = Math.max(0, (currentHour - 1) * 50);
                        calendarScrollRef.current.scrollTo({y: scrollY, animated: true});
                    }
                }, 800);
            }
        }
    }, [isLoading, trainingSessions, currentWeek, storeGetSessionsForWeek, setSelectedMember]);

    // getSessionsForWeek 함수를 로컬에 정의 (store 함수를 래핑)
    const getSessionsForWeek = (week: number) => {
        return storeGetSessionsForWeek(week);
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
            const currentWeekResponse = await trainerScheduleService.getAutoSchedulingResult(
                currentTime.getFullYear(),
                realCurrentWeek
            )
            const nextWeekResponse = await trainerScheduleService.getAutoSchedulingResult(
                currentTime.getFullYear(),
                realCurrentWeek + 1
            )

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
                            weekOfYear: weekOfYear
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
                onBack={() => router.back()}
            />

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
                                            if (calendarScrollRef.current) {
                                                const scrollY = session.hour * 50; // 50 is hourRow height
                                                calendarScrollRef.current.scrollTo({y: scrollY, animated: true});
                                            }
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
                                                        size={32}
                                                        color={isNext ? "white" : "#3B82F6"}
                                                    />
                                                    <Text
                                                        style={[styles.upcomingMemberName, isNext && styles.nextText]}>
                                                        {session.memberName}
                                                    </Text>
                                                </View>

                                                <View style={styles.upcomingDayRow}>
                                                    <View style={styles.nextDayRow}>
                                                        <Text style={[styles.upcomingTime, isNext && styles.nextText]}>
                                                            {period} {displayHour}시
                                                        </Text>
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
                    sessions={trainingSessions}
                    selectedMember={selectedMember}
                    onSelectMember={setSelectedMember}
                    scrollRef={calendarScrollRef}
                    isCurrentWeek={isCurrentWeek(currentWeek)}
                    currentWeek={currentWeek}
                    onWeekChange={setCurrentWeek}
                />
            </View>

            {/* Bottom Action Buttons */}
            <View style={styles.bottomButtonsContainer}>
                <TouchableOpacity
                    style={[
                        styles.notificationButton,
                        (!canSendNotification(currentWeek) || weekScheduleStatus[currentWeek] == AutoSchedulingResultStatus.FIXED) && styles.notificationButtonDisabled
                    ]}
                    onPress={() => {
                        if (canSendNotification(currentWeek)) {
                            if (isCurrentWeek(currentWeek)) {
                                Alert.alert(
                                    '일정 확정 불가',
                                    '이번 주차는 이미 일정이 확정 되었어요.\n다음 주차부터 일정 확정이 가능합니다.',
                                    [{text: '확인', style: 'default'}]
                                );
                            } else {
                                Alert.alert(
                                    '일정 확정 확인',
                                    `${currentWeek}주차 트레이닝 일정을 확정하고, 모든 회원에게 알림을 발송하시겠습니까?`,
                                    [
                                        {text: '취소', style: 'cancel'},
                                        {
                                            text: '확정',
                                            onPress: async () => {
                                                setIsFixingWeekSchedule(true);
                                                // Simulate notification sending
                                                await new Promise(resolve => setTimeout(resolve, 1500));
                                                setWeekScheduleStatus(currentWeek, true);
                                                setIsFixingWeekSchedule(false);
                                                Alert.alert('일정 확정 및 알림 발송 완료', `${currentWeek}주차 일정이 확정되고, 알림이 발송되었습니다.`);
                                            }
                                        }
                                    ]
                                );
                            }
                        }
                    }}
                    disabled={!canSendNotification(currentWeek) || weekScheduleStatus[currentWeek] == AutoSchedulingResultStatus.FIXED || isFixingWeekSchedule}
                >
                    {isFixingWeekSchedule ? (
                        <ActivityIndicator size="small" color="white"/>
                    ) : (
                        <>
                            <Ionicons
                                name={weekScheduleStatus[currentWeek] === AutoSchedulingResultStatus.FIXED ? "checkmark-circle" : isCurrentWeek(currentWeek) ? "lock-closed" : "notifications-outline"}
                                size={18}
                                color="white"
                            />
                            <Text style={styles.notificationButtonText}>
                                {weekScheduleStatus[currentWeek] === AutoSchedulingResultStatus.FIXED ? '일정 확정' : isCurrentWeek(currentWeek) ? '일정 확정 불가' : '일정 확정'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.weekResetButton,
                        (isPastWeek(currentWeek) || isCurrentWeek(currentWeek)) && styles.weekResetButtonDisabled
                    ]}
                    onPress={() => {
                        if (!isPastWeek(currentWeek) && !isCurrentWeek(currentWeek)) {
                            Alert.alert(
                                `${currentWeek}주차 일정 재설정`,
                                `${currentWeek}주차 트레이닝 일정을 재설정 하시겠습니까?`,
                                [
                                    {text: '취소', style: 'cancel'},
                                    {
                                        text: '재설정',
                                        onPress: () => {
                                            // Store에 재설정할 주차 정보 저장
                                            resetWeek(currentWeek);
                                            // 자동 스케줄링 화면으로 이동 (replace로 스택을 교체)
                                            router.replace({
                                                pathname: '/auto-scheduling',
                                                params: {
                                                    weekToReset: currentWeek,
                                                    resetMode: true
                                                }
                                            });
                                        }
                                    }
                                ]
                            );
                        }
                    }}
                    disabled={isPastWeek(currentWeek) || isCurrentWeek(currentWeek)}
                >
                    <Ionicons name="refresh" size={18} color="white"/>
                    <Text style={styles.weekResetButtonText}>일정 재설정</Text>
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
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    upcomingDate: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    upcomingHoursUntil: {
        fontSize: 14,
        fontWeight: '700',
    },
    upcomingDay: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    upcomingTime: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
    },
    upcomingMemberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    upcomingMemberName: {
        fontSize: 14,
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
    bottomButtonsContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        flexDirection: 'row',
        gap: 12,
    },
    notificationButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    notificationButtonDisabled: {
        backgroundColor: '#94A3B8',
        opacity: 0.8,
    },
    notificationButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    weekResetButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F59E0B',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    weekResetButtonDisabled: {
        backgroundColor: '#94A3B8',
        opacity: 0.8,
    },
    weekResetButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
});
