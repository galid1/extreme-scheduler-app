import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {AutoSchedulingResultStatus} from "@/src/types/enums";

interface SchedulingCompletedCardProps {
    weeklyAutoSchedulingResultStatus?: AutoSchedulingResultStatus,
    hasAutoSchedulingResults: boolean;
}

export default function SchedulingCompletedCard({
                                                    weeklyAutoSchedulingResultStatus,
                                                     hasAutoSchedulingResults,
                                                 }: SchedulingCompletedCardProps) {
    return (
        <View style={[styles.scheduledStateContainer && styles.scheduledStateContainerCompact]}>
            <View style={[styles.scheduledStateCard && styles.scheduledStateCardCompact]}>
                {
                    // 트레이너가 일정을 확정한 경우
                    (weeklyAutoSchedulingResultStatus && weeklyAutoSchedulingResultStatus === AutoSchedulingResultStatus.FIXED)? (
                        // 일정이 존재하는 경우
                        (hasAutoSchedulingResults) ? (
                            <>
                                <Text style={[styles.scheduledStateMessage, styles.scheduledStateMessageCompact]}>
                                    트레이닝 일정이 확정되었습니다.
                                </Text>
                                <Text style={styles.scheduledStateSubMessage}>
                                    확정된 일정을 확인해주세요.
                                </Text>
                            </>
                        ) : // 일정이 없는 경우
                            <>
                                <Text style={[styles.scheduledStateMessage, styles.scheduledStateMessageCompact]}>
                                    이번 주는 트레이너와의 일정이 맞지 않아{' '}
                                    스케줄된 세션이 없습니다.
                                </Text>
                            </>
                    ) : ( // 아직 일정 조정 중인 경우
                        <>
                            <Text style={styles.scheduledStateSubMessage}>
                                다음 주에는 트레이너와 일정을 조율하여{' '}
                                트레이닝 세션이 배정될 예정입니다.
                            </Text>
                        </>
                    )
                }
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    scheduledStateContainer: {
        gap: 10,
    },
    scheduledStateContainerCompact: {
        padding: 0,
        gap: 0,
    },
    scheduledStateCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 8,
        elevation: 3,
    },
    scheduledStateCardCompact: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        padding: 8,
        shadowColor: 'transparent',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 4,
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
    scheduledStateTitleCompact: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937',
    },
    scheduledStateMessage: {
        fontSize: 16,
        lineHeight: 24,
        color: '#4B5563',
    },
    scheduledStateMessageCompact: {
        fontSize: 12,
        lineHeight: 18,
        color: '#6B7280',
        marginBottom: 0,
    },
    scheduledStateSubMessage: {
        fontSize: 14,
        lineHeight: 20,
        color: '#6B7280',
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
});
