import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SchedulingCompletedCard from "@/src/components/member/SchedulingCompletedCard";
import { memberScheduleService } from '@/src/services/api/member-schedule.service';
import {getYearAndWeek} from "@/src/utils/dateUtils";

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
}: MemberSchedulePlanningFlowProps) {
    return (
        <View style={styles.container}>
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
            ) : (
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
                {!isScheduleRegistered ? (
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
                                ]}>트레이너 스케줄링</Text>
                            </View>
                        </View>
                        <View style={styles.waitingState}>
                            <Ionicons name="lock-closed-outline" size={ICON_SIZE_SMALL} color="#9CA3AF" />
                            <Text style={styles.waitingText}>희망 일정을 먼저 등록해주세요</Text>
                        </View>
                    </>
                ) : !isTrainerScheduled ? (
                    <View style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <View style={styles.stepTitleRow}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>3</Text>
                                </View>
                                <Text style={styles.stepTitle}>트레이너 스케줄링</Text>
                            </View>
                        </View>
                        <View style={styles.waitingState}>
                            <Ionicons name="time-outline" size={ICON_SIZE_MEDIUM} color="#3B82F6" />
                            <Text style={[styles.waitingText, { color: '#3B82F6' }]}>
                                트레이너가 스케줄링 중입니다
                            </Text>
                        </View>
                    </View>
                ) : hasSchedulingResults && onViewTrainingSchedule ? (
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
                        <SchedulingCompletedCard
                            hasAutoSchedulingResults={hasSchedulingResults}
                            compact={true}
                        />
                    </View>
                )}
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
});
