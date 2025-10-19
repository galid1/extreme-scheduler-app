import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrainingSession } from '@/src/store/useTrainingStore';
import {memberScheduleService} from "@/src/services/api";
import { useSchedulingEventStore } from '@/src/store/useSchedulingEventStore';

interface MemberScheduleActionsProps {
    selectedSession: TrainingSession | null;
    currentAccountId: number | undefined;
    onCancelComplete?: () => void;
}

export default function MemberScheduleActions({
    selectedSession,
    currentAccountId,
    onCancelComplete,
}: MemberScheduleActionsProps) {
    const { triggerRefresh } = useSchedulingEventStore();

    // 버튼 활성화 조건:
    // 1. selectedSession이 있어야 함
    // 2. selectedSession.memberId === currentAccountId (본인의 일정)
    // 3. autoSchedulingResultId가 있어야 함
    const isEnabled =
        selectedSession !== null &&
        currentAccountId !== undefined &&
        selectedSession.memberId === currentAccountId.toString() &&
        selectedSession.autoSchedulingResultLineId !== undefined;

    const handleCancelRequest = async () => {
        if (!selectedSession || !selectedSession.autoSchedulingResultLineId) {
            Alert.alert('오류', '취소할 일정을 선택해주세요.');
            return;
        }

        Alert.alert(
            '일정 취소 확인',
            `${selectedSession.day}요일 ${selectedSession.hour}시 트레이닝 일정을 취소 요청하시겠습니까?`,
            [
                { text: '아니오', style: 'cancel' },
                {
                    text: '예',
                    onPress: async () => {
                        try {
                            const result = await memberScheduleService.requestCancelAutoScheduling(
                                selectedSession.autoSchedulingResultLineId!
                            );

                            if (result.success) {
                                Alert.alert('완료', result.message || '일정 취소 요청이 완료되었습니다.');
                                // Trigger refresh to update MemberHome
                                triggerRefresh();
                                // Clear selected session
                                onCancelComplete?.();
                            } else {
                                Alert.alert('알림', result.message || '일정 취소 요청에 실패했습니다.');
                            }
                        } catch (error) {
                            console.error('일정 취소 오류:', error);
                            Alert.alert('오류', '일정 취소 중 문제가 발생했습니다.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.cancelButton,
                    !isEnabled && styles.cancelButtonDisabled
                ]}
                onPress={handleCancelRequest}
                disabled={!isEnabled}
            >
                <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color="white"
                />
                <Text style={styles.cancelButtonText}>
                    일정 취소 요청하기
                </Text>
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
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    cancelButtonDisabled: {
        backgroundColor: '#94A3B8',
        opacity: 0.6,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
});
