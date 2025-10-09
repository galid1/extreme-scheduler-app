import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CancelRequestDetailResponse } from '@/src/types/api';
import { trainerScheduleService } from '@/src/services/api/trainer-schedule.service';

interface TrainerCancelRequestsSectionProps {
    requests: CancelRequestDetailResponse[];
    onRequestProcessed: () => void;
}

export default function TrainerCancelRequestsSection({
    requests,
    onRequestProcessed,
}: TrainerCancelRequestsSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

    // 대기중인 요청만 필터링
    const pendingRequests = requests.filter(req => req.status === 'PENDING');

    // 요일을 한글로 변환
    const getDayOfWeekText = (dayOfWeek: string) => {
        const days: Record<string, string> = {
            'MONDAY': '월요일',
            'TUESDAY': '화요일',
            'WEDNESDAY': '수요일',
            'THURSDAY': '목요일',
            'FRIDAY': '금요일',
            'SATURDAY': '토요일',
            'SUNDAY': '일요일',
        };
        return days[dayOfWeek] || dayOfWeek;
    };

    // 승인 처리
    const handleApprove = async (requestId: number, memberName: string) => {
        Alert.alert(
            '취소 요청 승인',
            `${memberName} 님의 일정 취소 요청을 승인하시겠습니까?`,
            [
                { text: '아니오', style: 'cancel' },
                {
                    text: '예',
                    onPress: async () => {
                        setProcessingIds(prev => new Set(prev).add(requestId));
                        try {
                            const result = await trainerScheduleService.processCancelRequest(
                                requestId,
                                { action: 'APPROVE' }
                            );

                            if (result.success) {
                                Alert.alert('완료', '취소 요청이 승인되었습니다.');
                                onRequestProcessed();
                            } else {
                                Alert.alert('알림', '요청 처리에 실패했습니다.');
                            }
                        } catch (error) {
                            console.error('취소 요청 승인 오류:', error);
                            Alert.alert('오류', '요청 처리 중 문제가 발생했습니다.');
                        } finally {
                            setProcessingIds(prev => {
                                const next = new Set(prev);
                                next.delete(requestId);
                                return next;
                            });
                        }
                    }
                }
            ]
        );
    };

    // 거절 처리
    const handleReject = async (requestId: number, memberName: string) => {
        Alert.prompt(
            '취소 요청 거절',
            `${memberName} 님의 일정 취소 요청을 거절하시겠습니까?\n거절 사유를 입력해주세요.`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '거절',
                    onPress: async (rejectedReason) => {
                        if (!rejectedReason || rejectedReason.trim() === '') {
                            Alert.alert('알림', '거절 사유를 입력해주세요.');
                            return;
                        }

                        setProcessingIds(prev => new Set(prev).add(requestId));
                        try {
                            const result = await trainerScheduleService.processCancelRequest(
                                requestId,
                                { action: 'REJECT', rejectedReason: rejectedReason.trim() }
                            );

                            if (result.success) {
                                Alert.alert('완료', '취소 요청이 거절되었습니다.');
                                onRequestProcessed();
                            } else {
                                Alert.alert('알림', '요청 처리에 실패했습니다.');
                            }
                        } catch (error) {
                            console.error('취소 요청 거절 오류:', error);
                            Alert.alert('오류', '요청 처리 중 문제가 발생했습니다.');
                        } finally {
                            setProcessingIds(prev => {
                                const next = new Set(prev);
                                next.delete(requestId);
                                return next;
                            });
                        }
                    }
                }
            ],
            'plain-text'
        );
    };

    return (
        <View style={styles.container}>
            {/* 헤더 */}
            <TouchableOpacity
                style={styles.header}
                onPress={() => setIsExpanded(!isExpanded)}
                activeOpacity={0.7}
            >
                <View style={styles.headerLeft}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={20}
                        color={pendingRequests.length > 0 ? "#F59E0B" : "#6B7280"}
                    />
                    <Text style={[
                        styles.headerTitle,
                        pendingRequests.length > 0 && styles.headerTitleActive
                    ]}>
                        취소 대기중인 요청
                    </Text>
                    {pendingRequests.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                        </View>
                    )}
                </View>
                <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#6B7280"
                />
            </TouchableOpacity>

            {/* 요청 목록 */}
            {isExpanded && (
                <View style={styles.content}>
                    {pendingRequests.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="checkmark-circle-outline" size={32} color="#10B981" />
                            <Text style={styles.emptyText}>대기중인 취소 요청이 없습니다</Text>
                        </View>
                    ) : (
                        pendingRequests.map((request) => {
                            const isProcessing = processingIds.has(request.requestId);
                            return (
                                <View key={request.requestId} style={styles.requestCard}>
                                    <View style={styles.requestHeader}>
                                        <Text style={styles.memberName}>{request.memberName} 님</Text>
                                        <View style={styles.statusBadge}>
                                            <Text style={styles.statusText}>대기중</Text>
                                        </View>
                                    </View>

                                    <View style={styles.requestInfo}>
                                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                                        <Text style={styles.requestInfoText}>
                                            {getDayOfWeekText(request.dayOfWeek)} {request.startHour}:00 - {request.endHour}:00
                                        </Text>
                                    </View>

                                    <View style={styles.requestInfo}>
                                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                                        <Text style={styles.requestInfoText}>
                                            요청일: {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                                        </Text>
                                    </View>

                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
                                            onPress={() => handleReject(request.requestId, request.memberName)}
                                            disabled={isProcessing}
                                        >
                                            <Text style={styles.rejectButtonText}>거절</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.approveButton, isProcessing && styles.buttonDisabled]}
                                            onPress={() => handleApprove(request.requestId, request.memberName)}
                                            disabled={isProcessing}
                                        >
                                            <Text style={styles.approveButtonText}>승인</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
    },
    headerTitleActive: {
        color: '#1F2937',
    },
    badge: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#92400E',
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
    },
    requestCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
        gap: 8,
    },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    memberName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    statusBadge: {
        backgroundColor: '#FBBF24',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#78350F',
    },
    requestInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    requestInfoText: {
        fontSize: 13,
        color: '#6B7280',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    rejectButton: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    rejectButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    approveButton: {
        flex: 1,
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    approveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
