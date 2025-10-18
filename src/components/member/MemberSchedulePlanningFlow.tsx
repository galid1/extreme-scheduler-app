import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import SchedulingCompletedCard from "@/src/components/member/SchedulingCompletedCard";
import WeekInfo from "@/src/components/WeekInfo";

// Icon sizes
const ICON_SIZE_SMALL = 10;
const ICON_SIZE_MEDIUM = 16;

interface MemberSchedulePlanningFlowProps {
    // 1단계: 담당 트레이너 지정
    hasTrainer: boolean;
    onViewTrainerProfile: () => void;

    // 2단계: 희망 일정 등록
    isScheduleRegistered: boolean;
    onRegisterSchedule: () => void;
    onViewSchedule: () => void;
    onEditSchedule: () => void;

    // 3단계: 트레이너 스케줄링 대기
    isTrainerScheduled: boolean;
    hasSchedulingResults: boolean;
    onViewTrainingSchedule?: () => void;

    // 취소 요청 개수 (뱃지 표시용)
    cancelRequestsCount?: number;

    // 트레이너가 이미 자동 스케줄링을 완료했는지 여부
    trainerFixedAutoScheduling?: boolean;
}

export default function MemberSchedulePlanningFlow({
    hasTrainer,
    onViewTrainerProfile,
    isScheduleRegistered,
    onRegisterSchedule,
    onViewSchedule,
    onEditSchedule,
    isTrainerScheduled,
    hasSchedulingResults,
    onViewTrainingSchedule,
    cancelRequestsCount = 0,
    trainerFixedAutoScheduling = false,
}: MemberSchedulePlanningFlowProps) {
    return (
        <View style={styles.container}>
            <View style={styles.dashBoardTitleContainer}>
                <Text style={styles.dashboardTitle}>일정 계획</Text>
                <View style={styles.weekInfoInline}>
                    <WeekInfo nextWeek={true}/>
                </View>
            </View>

            {/* 1단계: 담당 트레이너 지정 */}
            <TouchableOpacity
                style={styles.stepContainer}
                onPress={onViewTrainerProfile}
                activeOpacity={0.7}
            >
                <View style={styles.stepHeader}>
                    <View style={styles.stepTitleRow}>
                        <View style={[
                            styles.stepNumber,
                            hasTrainer && styles.stepNumberCompleted
                        ]}>
                            {hasTrainer ? (
                                <Ionicons name="checkmark" size={ICON_SIZE_SMALL} color="white" />
                            ) : (
                                <Text style={styles.stepNumberText}>1</Text>
                            )}
                        </View>
                        <Text style={styles.stepTitle}>담당 트레이너 지정</Text>
                    </View>
                    <View style={styles.stepHeaderRight}>
                        {hasTrainer && (
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

            {/* 2단계: 희망 일정 등록 */}
            {!hasTrainer ? (
                // Case 1: 트레이너 미지정 - disabled
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
                            ]}>희망 일정 등록</Text>
                        </View>
                    </View>
                    <View style={styles.waitingState}>
                        <Ionicons name="lock-closed-outline" size={ICON_SIZE_MEDIUM} color="#9CA3AF" />
                        <Text style={styles.waitingText}>담당 트레이너를 먼저 지정해주세요</Text>
                    </View>
                </View>
            ) : isScheduleRegistered ? (
                // Case 2: 희망 일정 등록 완료
                <View style={styles.stepContainer}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepTitleRow}>
                            <View style={[
                                styles.stepNumber,
                                styles.stepNumberCompleted
                            ]}>
                                <Ionicons name="checkmark" size={ICON_SIZE_SMALL} color="white" />
                            </View>
                            <Text style={styles.stepTitle}>희망 일정 등록</Text>
                        </View>
                        <View style={styles.stepHeaderRight}>
                            <TouchableOpacity
                                style={styles.textButton}
                                onPress={onViewSchedule}
                            >
                                <Text style={styles.textButtonPrimary}>확인</Text>
                            </TouchableOpacity>
                            {isTrainerScheduled && (
                                <Ionicons
                                    name="chevron-forward"
                                    size={ICON_SIZE_MEDIUM}
                                    color={"#3B82F6"}
                                />
                            )}
                            {!isTrainerScheduled && (
                                <TouchableOpacity
                                    style={styles.textButton}
                                    onPress={onEditSchedule}
                                >
                                    <Text style={styles.textButtonPrimary}>수정</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            ) : trainerFixedAutoScheduling ? (
                // Case 3: 트레이너가 이미 스케줄링 완료 - 희망 일정 등록 불가
                <View style={styles.stepContainer}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepTitleRow}>
                            <View style={[
                                styles.stepNumber,
                                styles.stepNumberWarning
                            ]}>
                                <Ionicons name="alert-circle" size={ICON_SIZE_SMALL} color="white" />
                            </View>
                            <Text style={styles.stepTitle}>희망 일정 등록</Text>
                        </View>
                    </View>
                    <View style={[styles.waitingState, styles.warningState]}>
                        <Ionicons name="information-circle-outline" size={ICON_SIZE_MEDIUM} color="#F59E0B" />
                        <Text style={[styles.waitingText, { color: '#D97706', flex: 1 }]}>
                            트레이너가 이미 일정을 배정했습니다. 희망 일정 등록이 불가능합니다.
                        </Text>
                    </View>
                </View>
            ) : (
                // Case 4: 희망 일정 등록 가능
                <TouchableOpacity
                    style={styles.stepContainer}
                    onPress={onRegisterSchedule}
                    activeOpacity={0.7}
                >
                    <View style={styles.stepHeader}>
                        <View style={styles.stepTitleRow}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={styles.stepTitle}>희망 일정 등록</Text>
                        </View>
                        <View style={styles.stepHeaderRight}>
                            <View style={styles.textButton}>
                                <Text style={styles.textButtonPrimary}>등록하기</Text>
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

            {/* 3단계: 트레이너 스케줄링 대기 */}
                {trainerFixedAutoScheduling && !isScheduleRegistered ? (
                    // Case 1: 트레이너 스케줄링 완료했으나 희망 일정 미등록 - 경고
                    <View style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <View style={styles.stepTitleRow}>
                                <View style={[
                                    styles.stepNumber,
                                    styles.stepNumberWarning
                                ]}>
                                    <Ionicons name="close" size={ICON_SIZE_SMALL} color="white" />
                                </View>
                                <Text style={styles.stepTitle}>트레이너 스케줄링</Text>
                                {cancelRequestsCount > 0 && (
                                    <View style={styles.cancelRequestBadge}>
                                        <Text style={styles.cancelRequestBadgeText}>{cancelRequestsCount}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={[styles.waitingState, styles.warningState]}>
                            <Ionicons name="alert-circle-outline" size={ICON_SIZE_MEDIUM} color="#F59E0B" />
                            <Text style={[styles.waitingText, { color: '#D97706', flex: 1 }]}>
                                희망 일정 미등록으로 일정이 배정되지 않았습니다.
                            </Text>
                        </View>
                    </View>
                ) : !isScheduleRegistered ? (
                    // Case 2: 희망 일정 미등록 - disabled
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
                                    ]}>3</Text>
                                </View>
                                <Text style={[
                                    styles.stepTitle,
                                    styles.stepTitleDisabled
                                ]}>트레이너 스케줄링</Text>
                                {cancelRequestsCount > 0 && (
                                    <View style={styles.cancelRequestBadge}>
                                        <Text style={styles.cancelRequestBadgeText}>{cancelRequestsCount}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={styles.waitingState}>
                            <Ionicons name="lock-closed-outline" size={ICON_SIZE_SMALL} color="#9CA3AF" />
                            <Text style={styles.waitingText}>희망 일정을 먼저 등록해주세요</Text>
                        </View>
                    </View>
                ) : !trainerFixedAutoScheduling && !isTrainerScheduled ? (
                    // Case 3: 트레이너 스케줄링 진행 중
                    <View style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <View style={styles.stepTitleRow}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>3</Text>
                                </View>
                                <Text style={styles.stepTitle}>트레이너 스케줄링</Text>
                                {cancelRequestsCount > 0 && (
                                    <View style={styles.cancelRequestBadge}>
                                        <Text style={styles.cancelRequestBadgeText}>{cancelRequestsCount}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={styles.waitingState}>
                            <Ionicons name="time-outline" size={ICON_SIZE_MEDIUM} color="#3B82F6" />
                            <Text style={[styles.waitingText, { color: '#3B82F6' }]}>
                                트레이너가 스케줄링 중입니다
                            </Text>
                        </View>
                    </View>
                ) : trainerFixedAutoScheduling && isScheduleRegistered ? (
                    // Case 4: 트레이너가 고정한 스케줄링 완료 - 클릭 가능
                    <TouchableOpacity
                        style={styles.stepContainer}
                        onPress={onViewTrainingSchedule}
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
                                <Text style={styles.stepTitle}>트레이너 스케줄링</Text>
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
                        <View>
                            <SchedulingCompletedCard
                                hasAutoSchedulingResults={hasSchedulingResults}
                                compact={true}
                            />
                        </View>
                    </TouchableOpacity>
                ) : isTrainerScheduled && hasSchedulingResults ? (
                    // Case 5: 일반 스케줄링 완료 (결과 있음) - 클릭 가능
                    <TouchableOpacity
                        style={styles.stepContainer}
                        onPress={onViewTrainingSchedule}
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
                                <Text style={styles.stepTitle}>트레이너 스케줄링</Text>
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
                        <View>
                            <SchedulingCompletedCard
                                hasAutoSchedulingResults={hasSchedulingResults}
                                compact={true}
                            />
                        </View>
                    </TouchableOpacity>
                ) : (
                    // Case 6: 스케줄링 완료 (결과 없음) - 클릭 불가
                    <View style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <View style={styles.stepTitleRow}>
                                <View style={[
                                    styles.stepNumber,
                                    styles.stepNumberCompleted
                                ]}>
                                    <Ionicons name="checkmark" size={ICON_SIZE_SMALL} color="white" />
                                </View>
                                <Text style={styles.stepTitle}>트레이너 스케줄링</Text>
                            </View>
                        </View>
                        <View>
                            <SchedulingCompletedCard
                                hasAutoSchedulingResults={hasSchedulingResults}
                                compact={true}
                            />
                        </View>
                    </View>
                )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 0,
        marginVertical: 20,
    },
    dashBoardTitleContainer: {
        flexDirection: "row",
        alignItems: 'center',
    },
    dashboardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    weekInfoInline: {
        marginLeft: 10,
    },
    stepContainer: {
        paddingVertical: 6,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    stepHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
    stepNumberWarning: {
        backgroundColor: '#F59E0B',
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
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    stepTitleDisabled: {
        color: '#9CA3AF',
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
    waitingState: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 10,
        gap: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginVertical: 4,
    },
    waitingText: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '700',
    },
    warningState: {
        backgroundColor: '#FEF3C7',
        borderColor: '#FDE68A',
    },
    infoState: {
        backgroundColor: '#D1FAE5',
        borderColor: '#A7F3D0',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 0,
    },
    cancelRequestSection: {
        marginTop: 12,
        gap: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#92400E',
    },
    cancelRequestCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    requestInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    requestTime: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400E',
    },
    statusBadge: {
        backgroundColor: '#FBBF24',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#78350F',
    },
    requestDate: {
        fontSize: 11,
        color: '#A16207',
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
});
