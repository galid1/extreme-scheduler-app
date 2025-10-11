import React, {useMemo, useState} from 'react';
import {ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import WeekInfo from '@/src/components/WeekInfo';
import {DayOfWeek, OnetimeScheduleLine, PeriodicScheduleLine, RegisterScheduleRequest} from '@/src/types/api';
import {formatDateMMDD, getNextWeekDateRange, getNextWeekYearAndWeek, getYearAndWeek} from '@/src/utils/dateUtils';
import {useAuthStore} from '@/src/store/useAuthStore';
import {AccountType} from '@/src/types/enums';
import {memberScheduleService, trainerScheduleService} from '@/src/services/api';
import {useSchedulingEventStore} from "@/src/store/useSchedulingEventStore";

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 32; // paddingHorizontal: 16 * 2
const TIME_COLUMN_WIDTH = 40;
const AVAILABLE_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING - TIME_COLUMN_WIDTH;
const DAY_COLUMN_WIDTH = AVAILABLE_WIDTH / 7;

type TimeSlotState = 'none' | 'once' | 'recurring';

type DaySchedule = { [hour: number]: TimeSlotState };
type WeekSchedule = { [day: string]: DaySchedule };

interface TrainerScheduleDetailViewProps {
    periodicScheduleLines: PeriodicScheduleLine[];
    onetimeScheduleLines: OnetimeScheduleLine[];
    onClose: () => void;
    initialEditMode?: boolean;
}

export default function FreeTimeScheduleDetailView({
                                                       periodicScheduleLines,
                                                       onetimeScheduleLines,
                                                       onClose,
                                                       initialEditMode,
                                                   }: TrainerScheduleDetailViewProps) {
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    const hours = Array.from({length: 24}, (_, i) => i);

    // Calculate next week dates
    const weekDates = useMemo(() => {
        const {startDate} = getNextWeekDateRange();
        return days.map((day, index) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + index);
            return {
                day,
                date: formatDateMMDD(date),
            };
        });
    }, []);

    // Transform API response to Map format
    const freeTimeScheduleList = useMemo((): WeekSchedule => {
        if (onetimeScheduleLines.length === 0 && periodicScheduleLines.length === 0) {
            return {};
        }

        const dayMapping: { [key: string]: string } = {
            'MONDAY': '월',
            'TUESDAY': '화',
            'WEDNESDAY': '수',
            'THURSDAY': '목',
            'FRIDAY': '금',
            'SATURDAY': '토',
            'SUNDAY': '일',
        };

        const transformedSchedule: WeekSchedule = {};

        // Process periodic schedules (recurring)
        periodicScheduleLines.forEach((schedule) => {
            if (schedule.dayOfWeek) {
                const day = dayMapping[schedule.dayOfWeek];
                if (!transformedSchedule[day]) {
                    transformedSchedule[day] = {};
                }
                transformedSchedule[day][schedule.startHour] = 'recurring';
            }
        });

        // Process one-time schedules
        onetimeScheduleLines.forEach((schedule) => {
            if (schedule.scheduleDate) {
                const date = new Date(schedule.scheduleDate);
                const dayIndex = date.getDay();
                const days = ['일', '월', '화', '수', '목', '금', '토'];
                const day = days[dayIndex];

                if (!transformedSchedule[day]) {
                    transformedSchedule[day] = {};
                }
                transformedSchedule[day][schedule.startHour] = 'once';
            }
        });

        return transformedSchedule;
    }, [periodicScheduleLines, onetimeScheduleLines]);

    // Edit mode state
    const [isEditMode, setIsEditMode] = useState(initialEditMode);
    const [selectedTimes, setSelectedTimes] = useState<WeekSchedule>({});
    const [isSaving, setIsSaving] = useState(false);
    const {account} = useAuthStore();

    // Initialize selectedTimes if initialEditMode is true
    React.useEffect(() => {
        if (initialEditMode) {
            setSelectedTimes(JSON.parse(JSON.stringify(freeTimeScheduleList)));
        }
    }, [initialEditMode, freeTimeScheduleList]);

    // Handle time slot press in edit mode
    const handleTimeSlotPress = (day: string, hour: number) => {
        if (!isEditMode) return;

        setSelectedTimes((prev) => {
            const daySchedule = prev[day] || {};
            const currentState = daySchedule[hour] || 'none';

            const newDaySchedule = {...daySchedule};

            if (currentState === 'none') {
                // 없음 -> 반복
                newDaySchedule[hour] = 'recurring';
            } else if (currentState === 'recurring') {
                // 반복 -> 일회
                newDaySchedule[hour] = 'once';
            } else {
                // 일회 -> 없음
                delete newDaySchedule[hour];
            }

            return {...prev, [day]: newDaySchedule};
        });
    };

    // Handle edit button press
    const handleEditPress = async () => {
        if(account?.accountType === AccountType.MEMBER) {
                try {
                    const {targetYear, targetWeekOfYear} = getNextWeekYearAndWeek();

                    const result = await memberScheduleService.checkScheduleModificationAvailability(
                        targetYear,
                        targetWeekOfYear
                    );

                    if (!result.canModify) {
                        Alert.alert('알림', result.message || '일정을 수정할 수 없습니다.');
                        return;
                    }

                } catch (error) {
                    console.error('일정 수정 가능 여부 확인 오류:', error);
                    Alert.alert('오류', '일정 확인 중 문제가 발생했습니다.');
                }
        }

        setIsEditMode(true);
        setSelectedTimes(JSON.parse(JSON.stringify(freeTimeScheduleList)));

        // Show usage guide
        Alert.alert(
            '일정 수정 방법',
            '셀을 반복해서 눌러 변경할 수 있습니다.\n\n없음 → 매주 반복 → 일회 → 없음',
            [{text: '확인'}]
        );
    };

    // Handle cancel
    const handleCancel = () => {
        setIsEditMode(false);
        setSelectedTimes({});
    };

    // Handle save
    const handleSave = async () => {
        try {
            setIsSaving(true);

            const dayMapping: { [key: string]: DayOfWeek } = {
                '월': DayOfWeek.MONDAY,
                '화': DayOfWeek.TUESDAY,
                '수': DayOfWeek.WEDNESDAY,
                '목': DayOfWeek.THURSDAY,
                '금': DayOfWeek.FRIDAY,
                '토': DayOfWeek.SATURDAY,
                '일': DayOfWeek.SUNDAY,
            };

            const {startDate} = getNextWeekDateRange();
            const {targetYear, targetWeekOfYear} = getNextWeekYearAndWeek();

            // Build periodic schedules
            const periodicSchedules: { dayOfWeek: DayOfWeek; startHour: number; endHour: number }[] = [];
            // Build one-time schedules
            const onetimeSchedules: { scheduleDate: string; startHour: number; endHour: number }[] = [];

            Object.entries(selectedTimes).forEach(([day, daySchedule]) => {
                Object.entries(daySchedule).forEach(([hourStr, state]) => {
                    const hour = parseInt(hourStr);

                    if (state === 'recurring') {
                        periodicSchedules.push({
                            dayOfWeek: dayMapping[day],
                            startHour: hour,
                            endHour: hour + 1,
                        });
                    } else if (state === 'once') {
                        // Calculate date for this day
                        const dayIndex = days.indexOf(day);
                        const date = new Date(startDate);
                        date.setDate(startDate.getDate() + dayIndex);

                        // Format date to YYYY-MM-DD in local timezone (avoid UTC conversion)
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const dayOfMonth = String(date.getDate()).padStart(2, '0');
                        const scheduleDate = `${year}-${month}-${dayOfMonth}`;

                        onetimeSchedules.push({
                            scheduleDate,
                            startHour: hour,
                            endHour: hour + 1,
                        });
                    }
                });
            });

            const request: RegisterScheduleRequest = {
                targetYear: targetYear,
                targetWeekOfYear: targetWeekOfYear,
                periodicScheduleLines: periodicSchedules,
                onetimeScheduleLines: onetimeSchedules,
            };

            // Call appropriate service based on account type
            if (account?.accountType === AccountType.MEMBER) {
                const result = await memberScheduleService.registerSchedule(request);

                if(result.success) {
                    Alert.alert('완료', '일정이 수정되었습니다.');
                } else {
                    Alert.alert('실패', result.message);
                }
                setIsEditMode(false);
                useSchedulingEventStore.getState().triggerRefresh();
                onClose();
            } else if (account?.accountType === AccountType.TRAINER) {
                const result = await trainerScheduleService.registerSchedule(request);
                Alert.alert('완료', '일정이 수정되었습니다.');
                setIsEditMode(false);
                useSchedulingEventStore.getState().triggerRefresh();
                onClose();
            }
        } catch (error) {
            console.error('일정 수정 오류:', error);
            Alert.alert('오류', '일정 수정 중 문제가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    // Get display schedule (use selectedTimes in edit mode, otherwise use freeTimeScheduleList)
    const displaySchedule = isEditMode ? selectedTimes : freeTimeScheduleList;

    return (
        <SafeAreaView style={[styles.container, {backgroundColor: 'white'}]}>
            <View style={styles.scheduleDetailHeader}>
                <TouchableOpacity
                    style={styles.scheduleDetailBackButton}
                    onPress={isEditMode ? handleCancel : onClose}
                >
                    {isEditMode ? (
                        <Text style={styles.scheduleDetailCancelText}>취소</Text>
                    ) : (
                        <Ionicons name="arrow-back" size={24} color="#3B82F6"/>
                    )}
                </TouchableOpacity>
                <View style={styles.scheduleDetailTitleContainer}>
                    <Text style={styles.scheduleDetailTitle}>
                        {account?.accountType === AccountType.TRAINER ? '운영 일정' : '희망 일정'}
                    </Text>
                    <WeekInfo style={styles.scheduleDetailWeekInfo} nextWeek={true}/>
                </View>
                {isEditMode ? (
                    <TouchableOpacity
                        style={[styles.scheduleDetailEditButton, isSaving && styles.scheduleDetailEditButtonDisabled]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#3B82F6"/>
                        ) : (
                            <Text style={styles.scheduleDetailEditButtonText}>저장</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.scheduleDetailEditButton}
                        onPress={handleEditPress}
                    >
                        <Text style={styles.scheduleDetailEditButtonText}>수정</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.scheduleCalendarContainer}>
                {/* Days header */}
                <View style={styles.calendarHeader}>
                    <View style={styles.timeColumnHeader}/>
                    {weekDates.map((dateInfo) => (
                        <View key={dateInfo.day} style={styles.dayColumnHeader}>
                            <Text style={styles.dayColumnText}>{dateInfo.day}</Text>
                            <Text style={styles.dateText}>{dateInfo.date}</Text>
                        </View>
                    ))}
                </View>

                {/* Time grid */}
                <ScrollView style={styles.calendarBody} showsVerticalScrollIndicator={false}>
                    {hours.map((hour) => {
                        const isPM = hour >= 12;
                        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                        const period = isPM ? '오후' : '오전';

                        return (
                            <View key={hour} style={[styles.timeRow, isPM && styles.timeRowPM]}>
                                <View style={[styles.timeLabel, isPM && styles.timeLabelPM]}>
                                    <Text style={styles.timeLabelPeriod}>{period}</Text>
                                    <Text style={styles.timeLabelText}>{displayHour}시</Text>
                                </View>
                                {days.map((day) => {
                                    const state = displaySchedule?.[day]?.[hour] || 'none';

                                    const cellContent = (
                                        <View
                                            style={[
                                                styles.timeCell,
                                                isPM && styles.timeCellPM,
                                                state === 'once' && styles.timeCellOnce,
                                                state === 'recurring' && styles.timeCellRecurring,
                                                isEditMode && styles.timeCellEditable,
                                            ]}
                                        >
                                            {state === 'recurring' && (
                                                <View style={styles.timeCellIndicator}>
                                                    <Ionicons name="repeat" size={12} color="white"/>
                                                </View>
                                            )}
                                        </View>
                                    );

                                    if (isEditMode) {
                                        return (
                                            <TouchableOpacity
                                                key={`${day}-${hour}`}
                                                onPress={() => handleTimeSlotPress(day, hour)}
                                                activeOpacity={0.7}
                                            >
                                                {cellContent}
                                            </TouchableOpacity>
                                        );
                                    }

                                    return (
                                        <View key={`${day}-${hour}`}>
                                            {cellContent}
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
                    <View
                        style={[
                            styles.legendColor,
                            {backgroundColor: '#3B82F6', borderWidth: 1, borderColor: '#3B82F6'},
                        ]}
                    />
                    <Text style={styles.legendText}>일회</Text>
                </View>
                <View style={styles.legendItem}>
                    <View
                        style={[
                            styles.legendColor,
                            {backgroundColor: '#8B5CF6', borderWidth: 1, borderColor: '#8B5CF6'},
                        ]}
                    />
                    <Text style={styles.legendText}>매주 반복</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scheduleDetailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    scheduleDetailBackButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scheduleDetailEditButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scheduleDetailEditButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    scheduleDetailEditButtonDisabled: {
        opacity: 0.5,
    },
    scheduleDetailCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    scheduleDetailTitleContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: -1,
    },
    scheduleDetailTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    scheduleDetailWeekInfo: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    scheduleCalendarContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    calendarHeader: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#E5E7EB',
    },
    timeColumnHeader: {
        width: TIME_COLUMN_WIDTH,
    },
    dayColumnHeader: {
        width: DAY_COLUMN_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    dayColumnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    dateText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#6B7280',
    },
    calendarBody: {
        flex: 1,
    },
    timeRow: {
        flexDirection: 'row',
        height: 48,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    timeRowPM: {
        backgroundColor: '#FAFAFA',
    },
    timeLabel: {
        width: TIME_COLUMN_WIDTH,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingHorizontal: 8,
    },
    timeLabelPM: {
        backgroundColor: '#F9FAFB',
    },
    timeLabelPeriod: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '800',
    },
    timeLabelText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
    },
    timeCell: {
        width: DAY_COLUMN_WIDTH,
        height: 48,
        borderLeftWidth: 1,
        borderLeftColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeCellPM: {
        backgroundColor: '#FAFAFA',
    },
    timeCellOnce: {
        backgroundColor: '#3B82F6',
    },
    timeCellRecurring: {
        backgroundColor: '#8B5CF6',
    },
    timeCellEditable: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    timeCellIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 24,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendColor: {
        width: 20,
        height: 20,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
});
