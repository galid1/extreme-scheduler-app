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
import {getCurrentWeek, getYearAndWeek} from '@/src/utils/dateUtils';
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

    // Edit mode states
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedSessionForMove, setSelectedSessionForMove] = useState<TrainingSession | null>(null);
    const [editedSessions, setEditedSessions] = useState<TrainingSession[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // 스케줄 변경 사항을 추적하기 위한 Map: autoSchedulingResultLineId -> {originalStartHour, originalEndHour, newStartHour, newEndHour}
    interface ScheduleChange {
        autoSchedulingResultLineId: number;
        memberName: string;
        originalDay: string;
        originalStartHour: number;
        originalEndHour: number;
        newDay: string;
        newStartHour: number;
        newEndHour: number;
    }
    const [scheduleChanges, setScheduleChanges] = useState<Map<number, ScheduleChange>>(new Map());

    useEffect(() => {
        // Store에 이미 주차가 설정되어 있으면 그대로 사용 (auto-scheduling에서 설정한 경우)
        // 설정되어 있지 않거나 0이면 현재 실제 주차로 초기화
        if (!currentWeek || currentWeek === 0) {
            const realCurrentWeek = getCurrentWeek();
            setCurrentWeek(realCurrentWeek);
        }

        fetchTrainingSessions();
    }, []);

    // 가장 가까운 세션 찾기 및 자동 포커스
    useEffect(() => {
        if (!isLoading && trainingSessions.length > 0) {
            const weekSessions = storeGetSessionsForWeek(currentWeek);
            if (weekSessions.length === 0) return;

            const today = new Date();
            const { targetWeekOfYear: realCurrentWeek } = getYearAndWeek(today);

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
            const { targetWeekOfYear: realCurrentWeek } = getYearAndWeek(today);

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
                const allRequests = [...currentWeekRequests.data, ...nextWeekRequests.data].map(req => ({
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

    // Handle edit mode
    const handleEditPress = () => {
        setIsEditMode(true);
        setEditedSessions(JSON.parse(JSON.stringify(trainingSessions)));
        setSelectedSessionForMove(null);
        setScheduleChanges(new Map()); // 변경 사항 초기화

        Alert.alert(
            '일정 수정 방법',
            '스케줄을 선택하고 이동할 위치를 클릭하세요.\n\n1. 기존 스케줄 클릭 → 선택\n2. 빈 셀 클릭 → 이동',
            [{text: '확인'}]
        );
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setEditedSessions([]);
        setSelectedSessionForMove(null);
        setScheduleChanges(new Map()); // 변경 사항 초기화
    };

    const handleSaveEdit = async () => {
        try {
            setIsSaving(true);

            if (scheduleChanges.size === 0) {
                Alert.alert('알림', '변경된 일정이 없습니다.');
                setIsEditMode(false);
                setEditedSessions([]);
                setSelectedSessionForMove(null);
                setScheduleChanges(new Map());
                setIsSaving(false);
                return;
            }

            // 변경된 회원 이름 목록 생성
            const changedMemberNames = Array.from(new Set(
                Array.from(scheduleChanges.values()).map(change => change.memberName)
            ));
            const memberNamesText = changedMemberNames.join(', ');

            // 저장 확인 Alert
            Alert.alert(
                '일정 저장',
                `${scheduleChanges.size}개의 일정을 저장하시겠습니까?\n\n변경된 회원: ${memberNamesText}\n\n일정이 변경된 회원에게 알림이 발송됩니다.`,
                [
                    {
                        text: '취소',
                        style: 'cancel',
                        onPress: () => {
                            setIsSaving(false);
                        }
                    },
                    {
                        text: '저장',
                        onPress: async () => {
                            try {
                                // 한글 요일 -> DayOfWeek enum 변환
                                const dayToEnumMap: { [key: string]: string } = {
                                    '월': 'MONDAY',
                                    '화': 'TUESDAY',
                                    '수': 'WEDNESDAY',
                                    '목': 'THURSDAY',
                                    '금': 'FRIDAY',
                                    '토': 'SATURDAY',
                                    '일': 'SUNDAY'
                                };

                                // scheduleChanges를 API 요청 형식으로 변환
                                const updates = Array.from(scheduleChanges.values()).map(change => ({
                                    autoSchedulingResultLineId: change.autoSchedulingResultLineId,
                                    toDayOfWeek: dayToEnumMap[change.newDay] as any,
                                    toStartHour: change.newStartHour,
                                    toEndHour: change.newEndHour,
                                }));

                                // API 호출
                                const response = await trainerScheduleService.updateAutoSchedulingResultLines({
                                    updates
                                });

                                Alert.alert('완료', `${response.updatedCount}개의 일정이 수정되었습니다.\n해당 회원에게 알림이 발송되었습니다.`);
                                setIsEditMode(false);
                                setEditedSessions([]);
                                setSelectedSessionForMove(null);
                                setScheduleChanges(new Map());

                                // 데이터 새로고침
                                await fetchTrainingSessions();
                            } catch (error) {
                                console.error('일정 수정 오류:', error);
                                Alert.alert('오류', '일정 수정 중 문제가 발생했습니다.');
                            } finally {
                                setIsSaving(false);
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('일정 수정 오류:', error);
            Alert.alert('오류', '일정 수정 중 문제가 발생했습니다.');
            setIsSaving(false);
        }
    };

    // Handle cell press in edit mode
    const handleCellPress = (day: string, hour: number, weekOfYear: number, session?: TrainingSession) => {
        // 기존 스케줄 클릭: 선택
        if (session) {
            setSelectedSessionForMove(session);
            return;
        }

        // 빈 셀 클릭: 선택된 세션이 있으면 이동
        if (selectedSessionForMove) {
            if (!selectedSessionForMove.autoSchedulingResultLineId) {
                Alert.alert('오류', '스케줄 ID를 찾을 수 없습니다.');
                return;
            }

            // 현재 editedSessions에서 선택된 세션의 모든 연속 시간대 찾기 (현재 위치)
            // 요일 조건을 제거: 이동된 세션은 다른 요일에 있을 수 있으므로 autoSchedulingResultLineId로만 찾음
            const currentMemberSessions = editedSessions.filter(s =>
                s.autoSchedulingResultLineId === selectedSessionForMove.autoSchedulingResultLineId
            ).sort((a, b) => a.hour - b.hour);

            if (currentMemberSessions.length === 0) {
                Alert.alert('오류', '현재 세션을 찾을 수 없습니다.');
                return;
            }

            const currentStartHour = currentMemberSessions[0].hour;
            const currentEndHour = currentMemberSessions[currentMemberSessions.length - 1].hour + 1;
            const duration = currentEndHour - currentStartHour;

            // 새 위치에서 연속된 빈 셀이 충분한지 확인
            const newEndHour = hour + duration;
            for (let h = hour; h < newEndHour; h++) {
                const existingSession = editedSessions.find(s =>
                    s.day === day && s.hour === h && s.weekOfYear === weekOfYear
                );
                if (existingSession) {
                    Alert.alert('오류', `${h}시에 이미 다른 일정이 있습니다.`);
                    return;
                }
            }

            // 업데이트된 세션 생성
            const updatedSessions = editedSessions.map(s => {
                // 이동할 세션들 찾기
                const isMovingSession = currentMemberSessions.some(ms =>
                    s.day === ms.day &&
                    s.hour === ms.hour &&
                    s.weekOfYear === ms.weekOfYear &&
                    s.memberId === ms.memberId
                );

                if (isMovingSession) {
                    const hourOffset = s.hour - currentStartHour;
                    return {
                        ...s,
                        day,
                        hour: hour + hourOffset,
                        weekOfYear,
                    };
                }
                return s;
            });

            setEditedSessions(updatedSessions);
            setTrainingSessions(updatedSessions);

            // 변경 사항 저장 - 이동된 셀의 새로운 시간으로 저장
            // 원본 정보는 scheduleChanges에 이미 있으면 유지, 없으면 처음 선택한 위치 사용
            const existingChange = scheduleChanges.get(selectedSessionForMove.autoSchedulingResultLineId);
            const originalDay = existingChange?.originalDay || selectedSessionForMove.day;
            const originalStartHour = existingChange?.originalStartHour || currentStartHour;
            const originalEndHour = existingChange?.originalEndHour || currentEndHour;

            const newChanges = new Map(scheduleChanges);
            newChanges.set(selectedSessionForMove.autoSchedulingResultLineId, {
                autoSchedulingResultLineId: selectedSessionForMove.autoSchedulingResultLineId,
                memberName: selectedSessionForMove.memberName,
                originalDay,
                originalStartHour,
                originalEndHour,
                newDay: day,
                newStartHour: hour,
                newEndHour: newEndHour,
            });

            setScheduleChanges(newChanges);
            setSelectedSessionForMove(null);
        }
    };

    const fetchTrainingSessions = async () => {
        setIsLoading(true);
        try {
            // 현재 주차 계산
            const today = new Date();
            const { targetWeekOfYear: realCurrentWeek } = getYearAndWeek(today);

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
                // 회원: memberScheduleService 사용 (data 필드를 scheduleList로 변환)
                const currentWeekData = await memberScheduleService.getFixedAutoSchedulingResult(
                    currentTime.getFullYear(),
                    realCurrentWeek
                );
                const nextWeekData = await memberScheduleService.getFixedAutoSchedulingResult(
                    currentTime.getFullYear(),
                    realCurrentWeek + 1
                );

                currentWeekResponse = {scheduleList: currentWeekData.data};
                nextWeekResponse = {scheduleList: nextWeekData.data};
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
        const { targetWeekOfYear: realCurrentWeek } = getYearAndWeek(new Date());
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
                showEditButton={account?.accountType === AccountType.TRAINER && !isPastWeek(currentWeek)}
                isEditMode={isEditMode}
                onEditPress={handleEditPress}
                onSavePress={handleSaveEdit}
                onCancelPress={handleCancelEdit}
                isSaving={isSaving}
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
                                const { targetWeekOfYear: currentWeekOfYear } = getYearAndWeek(currentDate);

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
                    isEditMode={isEditMode}
                    selectedSessionForMove={selectedSessionForMove}
                    onCellPress={handleCellPress}
                />

                {/* Floating Guidance Message - Only show in edit mode */}
                {isEditMode && (
                    <View style={styles.floatingGuidance}>
                        <View style={styles.guidanceContent}>
                            <Ionicons
                                name={selectedSessionForMove ? "arrow-forward-circle" : "hand-left"}
                                size={20}
                                color="#3B82F6"
                            />
                            <Text style={styles.guidanceText}>
                                {selectedSessionForMove
                                    ? "이동을 원하는 셀을 선택하세요"
                                    : "변경을 원하는 일정의 셀을 선택하세요"}
                            </Text>
                        </View>
                    </View>
                )}
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
    floatingGuidance: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        alignItems: 'center',
        zIndex: 100,
    },
    guidanceContent: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 24,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    guidanceText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
});
