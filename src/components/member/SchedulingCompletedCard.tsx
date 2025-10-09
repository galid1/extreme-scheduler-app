import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

interface SchedulingCompletedCardProps {
    hasAutoSchedulingResults: boolean;
    compact?: boolean;
}

export default function SchedulingCompletedCard({
                                                     hasAutoSchedulingResults,
                                                     compact = false,
                                                 }: SchedulingCompletedCardProps) {
    return (
        <View style={[styles.scheduledStateContainer, compact && styles.scheduledStateContainerCompact]}>
            <View style={[styles.scheduledStateCard, compact && styles.scheduledStateCardCompact]}>
                {!hasAutoSchedulingResults ? (
                    <>
                        <Text style={[styles.scheduledStateMessage, compact && styles.scheduledStateMessageCompact]}>
                            이번 주는 트레이너와의 일정이 맞지 않아{' '}
                            스케줄된 세션이 없습니다.
                        </Text>
                        {!compact && (
                            <Text style={styles.scheduledStateSubMessage}>
                                다음 주에는 트레이너와 일정을 조율하여{' '}
                                트레이닝 세션이 배정될 예정입니다.
                            </Text>
                        )}
                    </>
                ) : (
                    <>
                        <Text style={[styles.scheduledStateMessage, compact && styles.scheduledStateMessageCompact]}>
                            트레이닝 일정이 확정되었습니다.
                        </Text>
                        {!compact && (
                            <Text style={styles.scheduledStateSubMessage}>
                                확정된 일정을 확인해주세요.
                            </Text>
                        )}
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    scheduledStateContainer: {
        gap: 16,
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
        padding: 12,
        shadowColor: 'transparent',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 8,
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
        marginBottom: 8,
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
});
