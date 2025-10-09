import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AccountType } from '@/src/types/enums';
import { AutoSchedulingResultStatus, trainerScheduleService } from '@/src/services/api';
import ScheduleResetButton from '@/src/components/training/ScheduleResetButton';
import { useSchedulingEventStore } from '@/src/store/useSchedulingEventStore';

interface TrainerScheduleActionsProps {
    currentWeek: number;
    isNextWeek: (week: number) => boolean;
    isPastWeek: (week: number) => boolean;
    isCurrentWeek: (week: number) => boolean;
    isAlreadyFixed: boolean;
    isFixingWeekSchedule: boolean;
    setIsFixingWeekSchedule: (value: boolean) => void;
    setNextWeekAutoSchedulingStatus: (status: AutoSchedulingResultStatus) => void;
}

export default function TrainerScheduleActions({
    currentWeek,
    isNextWeek,
    isPastWeek,
    isCurrentWeek,
    isAlreadyFixed,
    isFixingWeekSchedule,
    setIsFixingWeekSchedule,
    setNextWeekAutoSchedulingStatus,
}: TrainerScheduleActionsProps) {
    // Only show for next week (not past week and not current week)
    if (!isNextWeek(currentWeek)) {
        return null;
    }

    const handleConfirm = async () => {
        Alert.alert(
            '일정 확정 확인',
            `${currentWeek}주차 트레이닝 일정을 확정하고, 모든 회원에게 알림을 발송하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '확정',
                    onPress: async () => {
                        setIsFixingWeekSchedule(true);
                        try {
                            const today = new Date();
                            const currentYear = today.getFullYear();

                            const result = await trainerScheduleService.fixAutoScheduling(
                                currentYear,
                                currentWeek
                            );

                            if (result.success) {
                                // Update the status to FIXED
                                setNextWeekAutoSchedulingStatus(AutoSchedulingResultStatus.FIXED);

                                // 상태 갱신 (TrainerHome 새로고침)
                                const { triggerRefresh } = useSchedulingEventStore.getState();
                                triggerRefresh();

                                Alert.alert('완료', '일정이 확정되고, 알림이 발송되었습니다.');
                            } else {
                                Alert.alert('오류', '일정 확정에 실패했습니다.');
                            }
                        } catch (error) {
                            console.error('일정 확정 오류:', error);
                            Alert.alert('오류', '일정 확정 중 문제가 발생했습니다.');
                        } finally {
                            setIsFixingWeekSchedule(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ScheduleResetButton
                currentWeek={currentWeek}
                disabled={isPastWeek(currentWeek) || isCurrentWeek(currentWeek)}
                style={styles.resetButton}
                isScheduleFixed={isAlreadyFixed}
            />

            <TouchableOpacity
                style={[
                    styles.confirmButton,
                    isAlreadyFixed && styles.confirmButtonDisabled
                ]}
                onPress={handleConfirm}
                disabled={isAlreadyFixed || isFixingWeekSchedule}
            >
                {isFixingWeekSchedule ? (
                    <ActivityIndicator size="small" color="white" />
                ) : (
                    <>
                        <Ionicons
                            name={isAlreadyFixed ? "checkmark-circle" : "notifications-outline"}
                            size={18}
                            color="white"
                        />
                        <Text style={styles.confirmButtonText}>
                            {isAlreadyFixed ? '일정 확정됨' : '일정 확정'}
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        flexDirection: 'row',
        gap: 12,
    },
    resetButton: {
        flex: 1,
        borderRadius: 12,
    },
    confirmButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    confirmButtonDisabled: {
        backgroundColor: '#94A3B8',
        opacity: 0.8,
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
});
