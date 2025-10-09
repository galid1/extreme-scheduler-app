import React, {useState} from 'react';
import {ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {trainerScheduleService} from '@/src/services/api';
import {useSchedulingEventStore} from '@/src/store/useSchedulingEventStore';
import {useTrainingStore} from '@/src/store/useTrainingStore';

interface ScheduleResetButtonProps {
    currentWeek: number;
    disabled?: boolean;
    style?: any;
    isScheduleFixed?: boolean;
}

export default function ScheduleResetButton({currentWeek, disabled = false, style, isScheduleFixed = false}: ScheduleResetButtonProps) {
    const router = useRouter();
    const {resetWeek} = useTrainingStore();
    const {hasNextWeekScheduling} = useSchedulingEventStore();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleReset = async () => {
        const alertMessage = isScheduleFixed
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
                            setIsProcessing(true);

                            // 현재 연도 계산
                            const today = new Date();
                            const currentYear = today.getFullYear();

                            // 자동 스케줄링 결과 삭제 API 호출
                            const result = await trainerScheduleService.deleteAutoSchedulingResult(
                                currentYear,
                                currentWeek
                            );

                            if (result.success) {
                                // Store에 재설정할 주차 정보 저장
                                resetWeek(currentWeek);

                                // 상태 갱신 트리거
                                const {triggerRefresh} = useSchedulingEventStore.getState();
                                triggerRefresh();

                                // 자동 스케줄링 화면으로 이동 (replace로 스택을 교체)
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
                        } finally {
                            setIsProcessing(false);
                        }
                    }
                }
            ]
        );
    };

    const isDisabled = disabled || isProcessing || !hasNextWeekScheduling;

    return (
        <TouchableOpacity
            style={[
                styles.resetButton,
                isDisabled && styles.resetButtonDisabled,
                style
            ]}
            onPress={handleReset}
            disabled={isDisabled}
        >
            {isProcessing ? (
                <ActivityIndicator size="small" color="white"/>
            ) : (
                <>
                    <Ionicons name="refresh" size={18} color="white"/>
                    <Text style={styles.resetButtonText}>일정 재설정</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    resetButton: {
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
    resetButtonDisabled: {
        backgroundColor: '#94A3B8',
        opacity: 0.8,
    },
    resetButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
});
