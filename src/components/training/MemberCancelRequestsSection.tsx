import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CancelRequestDetailResponse } from '@/src/types/api';

interface MemberCancelRequestsSectionProps {
    requests: CancelRequestDetailResponse[];
}

export default function MemberCancelRequestsSection({
    requests,
}: MemberCancelRequestsSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);

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

    // 상태별 스타일 및 텍스트
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'PENDING':
                return {
                    text: '대기중',
                    color: '#FBBF24',
                    textColor: '#78350F',
                    bgColor: '#FEF3C7',
                    borderColor: '#FDE68A',
                };
            case 'APPROVED':
                return {
                    text: '승인됨',
                    color: '#10B981',
                    textColor: '#065F46',
                    bgColor: '#D1FAE5',
                    borderColor: '#A7F3D0',
                };
            case 'REJECTED':
                return {
                    text: '거절됨',
                    color: '#EF4444',
                    textColor: '#991B1B',
                    bgColor: '#FEE2E2',
                    borderColor: '#FECACA',
                };
            default:
                return {
                    text: status,
                    color: '#6B7280',
                    textColor: '#1F2937',
                    bgColor: '#F3F4F6',
                    borderColor: '#E5E7EB',
                };
        }
    };

    // 대기중인 요청만 필터링
    const pendingRequests = requests.filter(req => req.status === 'PENDING');

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
                        name="time-outline"
                        size={20}
                        color={pendingRequests.length > 0 ? "#F59E0B" : "#6B7280"}
                    />
                    <Text style={[
                        styles.headerTitle,
                        pendingRequests.length > 0 && styles.headerTitleActive
                    ]}>
                        취소 요청 내역
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
                    {requests.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="calendar-outline" size={32} color="#6B7280" />
                            <Text style={styles.emptyText}>취소 요청 내역이 없습니다</Text>
                        </View>
                    ) : (
                        requests.map((request) => {
                            const statusInfo = getStatusInfo(request.status);
                            return (
                                <View
                                    key={request.requestId}
                                    style={[
                                        styles.requestCard,
                                        {
                                            backgroundColor: statusInfo.bgColor,
                                            borderColor: statusInfo.borderColor,
                                        }
                                    ]}
                                >
                                    <View style={styles.requestHeader}>
                                        <View style={styles.timeInfo}>
                                            <Ionicons name="calendar-outline" size={16} color="#1F2937" />
                                            <Text style={styles.timeText}>
                                                {getDayOfWeekText(request.dayOfWeek)}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: statusInfo.color }
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    { color: statusInfo.textColor }
                                                ]}
                                            >
                                                {statusInfo.text}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.requestInfo}>
                                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                                        <Text style={styles.requestInfoText}>
                                            {request.startHour}:00 - {request.endHour}:00
                                        </Text>
                                    </View>

                                    <View style={styles.requestInfo}>
                                        <Ionicons name="create-outline" size={14} color="#6B7280" />
                                        <Text style={styles.requestInfoText}>
                                            요청일: {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                                        </Text>
                                    </View>

                                    {/* 거절된 경우 사유 표시 */}
                                    {request.status === 'REJECTED' && request.rejectedReason && (
                                        <View style={styles.rejectedReasonContainer}>
                                            <Text style={styles.rejectedReasonLabel}>거절 사유:</Text>
                                            <Text style={styles.rejectedReasonText}>
                                                {request.rejectedReason}
                                            </Text>
                                        </View>
                                    )}
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
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        gap: 8,
    },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
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
    rejectedReasonContainer: {
        marginTop: 4,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 6,
    },
    rejectedReasonLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#991B1B',
        marginBottom: 4,
    },
    rejectedReasonText: {
        fontSize: 12,
        color: '#6B7280',
    },
});
