import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Icon sizes
const ICON_SIZE_SMALL = 10;
const ICON_SIZE_MEDIUM = 16;
const ICON_SIZE_LARGE = 18;
const ICON_SIZE_ACTION = 20;

interface SchedulePlanningFlowProps {
    // 1단계: 운영 일정
    isOperationScheduleRegistered: boolean;
    onShowOperationSchedule: () => void;
    onEditOperationSchedule: () => void;

    // 2단계: 자동 스케줄링
    hasAutoSchedulingResult: boolean;
    onStartAutoScheduling: () => void;
    onViewSchedulingResult: () => void;

    // 3단계: 일정 확정
    isScheduleConfirmed: boolean;
    onConfirmSchedule: () => void;
    onResetSchedule: () => void;

    // 취소 요청 개수 (뱃지 표시용)
    cancelRequestsCount?: number;
}

export default function SchedulePlanningFlow({
    isOperationScheduleRegistered,
    onShowOperationSchedule,
    onEditOperationSchedule,
    hasAutoSchedulingResult,
    onStartAutoScheduling,
    onViewSchedulingResult,
    isScheduleConfirmed,
    onConfirmSchedule,
    onResetSchedule,
    cancelRequestsCount = 0,
}: SchedulePlanningFlowProps) {
    const handleOnShowOperationSchedule = () => {
        if (isOperationScheduleRegistered) {
            onShowOperationSchedule();
        } else {
            onEditOperationSchedule();
        }
    }

    return (
        <View style={styles.container}>
            {/* 1단계: 운영 일정 설정 */}
            <TouchableOpacity
                style={styles.stepContainer}
                onPress={handleOnShowOperationSchedule}
                activeOpacity={0.7}
            >
                <View style={styles.stepHeader}>
                    <View style={styles.stepTitleRow}>
                        <View style={[
                            styles.stepNumber,
                            isOperationScheduleRegistered && styles.stepNumberCompleted
                        ]}>
                            {isOperationScheduleRegistered ? (
                                <Ionicons name="checkmark" size={ICON_SIZE_SMALL} color="white" />
                            ) : (
                                <Text style={styles.stepNumberText}>1</Text>
                            )}
                        </View>
                        <Text style={styles.stepTitle}>운영 일정 설정</Text>
                    </View>
                    <View style={styles.stepHeaderRight}>
                        {isOperationScheduleRegistered && (
                            <View style={styles.textButton}>
                                <Text style={styles.textButtonPrimary}>확인</Text>
                            </View>
                        )}
                        <Ionicons
                            name="chevron-forward"
                            size={ICON_SIZE_MEDIUM}
                            color={"#3B82F6"}
                        />
                    </View>
                </View>
            </TouchableOpacity>

            {/* 구분선 */}
            <View style={styles.divider} />

            {/* 2단계: 자동 스케줄링 */}
            {!isOperationScheduleRegistered ? (
                <View style={styles.stepContainer}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepTitleRow}>
                            <View style={[
                                styles.stepNumber,
                                styles.stepNumberDisabled
                            ]}>
                                <Text style={[
                                    styles.stepNumberText,
                                    styles.stepNumberTextDisabled
                                ]}>2</Text>
                            </View>
                            <Text style={[
                                styles.stepTitle,
                                styles.stepTitleDisabled
                            ]}>자동 스케줄링</Text>
                            {cancelRequestsCount > 0 && (
                                <View style={styles.cancelRequestBadge}>
                                    <Text style={styles.cancelRequestBadgeText}>{cancelRequestsCount}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.waitingState}>
                        <Ionicons name="lock-closed-outline" size={ICON_SIZE_MEDIUM} color="#9CA3AF" />
                        <Text style={styles.waitingText}>운영 일정을 먼저 등록해주세요</Text>
                    </View>
                </View>
            ) : hasAutoSchedulingResult ? (
                <TouchableOpacity
                    style={styles.stepContainer}
                    onPress={onViewSchedulingResult}
                    activeOpacity={0.7}
                >
                    <View style={styles.stepHeader}>
                        <View style={styles.stepTitleRow}>
                            <View style={[
                                styles.stepNumber,
                                styles.stepNumberCompleted
                            ]}>
                                <Ionicons name="checkmark" size={ICON_SIZE_SMALL} color="white" />
                            </View>
                            <Text style={styles.stepTitle}>자동 스케줄링</Text>
                            {cancelRequestsCount > 0 && (
                                <View style={styles.cancelRequestBadge}>
                                    <Text style={styles.cancelRequestBadgeText}>{cancelRequestsCount}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.stepHeaderRight}>
                            <View style={styles.textButton}>
                                <Text style={styles.textButtonPrimary}>확인</Text>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={ICON_SIZE_MEDIUM}
                                color="#3B82F6"
                            />
                        </View>
                    </View>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.stepContainer}
                    onPress={onStartAutoScheduling}
                    activeOpacity={0.7}
                >
                    <View style={styles.stepHeader}>
                        <View style={styles.stepTitleRow}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={styles.stepTitle}>자동 스케줄링</Text>
                            {cancelRequestsCount > 0 && (
                                <View style={styles.cancelRequestBadge}>
                                    <Text style={styles.cancelRequestBadgeText}>{cancelRequestsCount}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.stepHeaderRight}>
                            <View style={styles.textButton}>
                                <Text style={styles.textButtonPrimary}>자동 스케줄링</Text>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={ICON_SIZE_MEDIUM}
                                color="#10B981"
                            />
                        </View>
                    </View>
                </TouchableOpacity>
            )}

            {/* 구분선 */}
            <View style={styles.divider} />

            {/* 3단계: 일정 확정 */}
            <View style={styles.stepContainer}>
                {!hasAutoSchedulingResult ? (
                    <>
                        <View style={styles.stepHeader}>
                            <View style={styles.stepTitleRow}>
                                <View style={[
                                    styles.stepNumber,
                                    styles.stepNumberDisabled
                                ]}>
                                    <Text style={[
                                        styles.stepNumberText,
                                        styles.stepNumberTextDisabled
                                    ]}>3</Text>
                                </View>
                                <Text style={[
                                    styles.stepTitle,
                                    styles.stepTitleDisabled
                                ]}>일정 확정</Text>
                            </View>
                        </View>
                        <View style={styles.waitingState}>
                            <Ionicons name="lock-closed-outline" size={ICON_SIZE_SMALL} color="#9CA3AF" />
                            <Text style={styles.waitingText}>자동 스케줄링을 먼저 진행해주세요</Text>
                        </View>
                    </>
                ) : !isScheduleConfirmed ? (
                    <>
                        <View style={styles.stepHeaderWithActions}>
                            <View style={styles.stepTitleRow}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>3</Text>
                                </View>
                                <Text style={styles.stepTitle}>일정 확정</Text>
                            </View>
                            <View style={styles.actionButtonsContainer}>
                                <TouchableOpacity
                                    style={styles.textButton}
                                    onPress={onResetSchedule}
                                >
                                    <Text style={styles.textButtonWarning}>재설정</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.textButton}
                                    onPress={onConfirmSchedule}
                                >
                                    <Text style={styles.textButtonPrimary}>스케줄 확인</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.confirmNoticeContainer}>
                            <View style={styles.confirmNoticeHeader}>
                                <Ionicons name="alert-circle" size={18} color="#F59E0B" />
                                <Text style={styles.confirmNoticeTitle}>일정 확정이 필요합니다</Text>
                            </View>
                            <Text style={styles.confirmNoticeText}>
                                일정을 확정해야 회원들에게 알림이 발송되고 트레이닝 스케줄이 최종 적용됩니다
                            </Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.stepHeader}>
                        <View style={styles.stepTitleRow}>
                            <View style={[
                                styles.stepNumber,
                                styles.stepNumberCompleted
                            ]}>
                                <Ionicons name="checkmark" size={ICON_SIZE_SMALL} color="white" />
                            </View>
                            <Text style={styles.stepTitle}>일정 확정</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.textButton}
                            onPress={onResetSchedule}
                        >
                            <Text style={styles.textButtonWarning}>재설정</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 0,
    },
    stepContainer: {
        paddingVertical: 16,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepHeaderWithActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    stepNumber: {
        width: 16,
        height: 16,
        borderRadius: 14,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberCompleted: {
        backgroundColor: '#10B981',
    },
    stepNumberDisabled: {
        backgroundColor: '#D1D5DB',
    },
    stepNumberText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    stepNumberTextDisabled: {
        color: '#9CA3AF',
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    stepTitleDisabled: {
        color: '#9CA3AF',
    },
    completedBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    completedBadgeText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: '700',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    textButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textButtonPrimary: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3B82F6',
    },
    textButtonWarning: {
        fontSize: 13,
        fontWeight: '600',
        color: '#F59E0B',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 6,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    waitingState: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 8,
    },
    waitingText: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 0,
    },
    cancelRequestBadge: {
        backgroundColor: '#FEF3C7',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: '#FDE68A',
        marginLeft: 6,
    },
    cancelRequestBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#92400E',
    },
    confirmNoticeContainer: {
        backgroundColor: '#FFFBEB',
        borderRadius: 10,
        padding: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
        gap: 6,
    },
    confirmNoticeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    confirmNoticeTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#92400E',
    },
    confirmNoticeText: {
        fontSize: 12,
        color: '#78350F',
        lineHeight: 18,
    },
});
