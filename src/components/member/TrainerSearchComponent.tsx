import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {memberService} from '@/src/services/api';
import type {TrainerSearchResponse, MemberTrainerAssignmentRequestDto} from '@/src/types/api';

interface TrainerSearchComponentProps {
    onAssignmentSuccess: () => void;
}

export default function TrainerSearchComponent({
                                                   onAssignmentSuccess,
                                               }: TrainerSearchComponentProps) {
    const [trainerPhone, setTrainerPhone] = useState('');
    const [trainerProfile, setTrainerProfile] = useState<TrainerSearchResponse | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isCheckingRequest, setIsCheckingRequest] = useState(true);
    const [assignmentRequests, setAssignmentRequests] = useState<MemberTrainerAssignmentRequestDto[]>([]);

    const formatPhoneNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    };

    const handlePhoneChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 11) {
            setTrainerPhone(cleaned);
            setSearchError(null);
            if (cleaned.length < 11) {
                setTrainerProfile(null);
            }
        }
    };

    // Check if there's an existing assignment request on mount
    useEffect(() => {
        const checkExistingRequest = async () => {
            console.log('[TrainerSearchComponent] Checking for existing request...');
            try {
                const requests = await memberService.getMyTrainerAssignmentRequests();
                console.log('[TrainerSearchComponent] Request response:', JSON.stringify(requests));

                if (requests && requests.length > 0) {
                    setAssignmentRequests(requests);

                    // ACCEPTED 상태가 있으면 다른 화면으로 이동
                    const hasAccepted = requests.some(req => req.status === 'ACCEPTED');
                    if (hasAccepted) {
                        console.log('[TrainerSearchComponent] ACCEPTED request exists, calling onAssignmentSuccess');
                        onAssignmentSuccess();
                        return;
                    }

                    console.log('[TrainerSearchComponent] Requests exist but none accepted');
                } else {
                    console.log('[TrainerSearchComponent] No requests found (empty array)');
                }
            } catch (error: any) {
                console.log('[TrainerSearchComponent] Error or no request:', error);
            } finally {
                setIsCheckingRequest(false);
            }
        };

        checkExistingRequest();
    }, []);

    // Auto search when 11 digits are entered
    useEffect(() => {
        if (trainerPhone.length === 11) {
            searchTrainer();
        }
    }, [trainerPhone]);

    const searchTrainer = async () => {
        setIsSearching(true);
        setSearchError(null);
        try {
                const response = await memberService.searchTrainer(trainerPhone);
                if (response.exists) {
                    setTrainerProfile(response);
                } else {
                    setTrainerProfile(null);
                    setSearchError('해당 전화번호의 트레이너를 찾을 수 없습니다.');
                }
        } catch (error: any) {
            console.error('Error searching trainer:', error);
            setTrainerProfile(null);
            if (error.response?.status === 404) {
                setSearchError('해당 전화번호의 트레이너를 찾을 수 없습니다.');
            } else {
                setSearchError('트레이너 검색 중 오류가 발생했습니다.');
            }
        } finally {
            setIsSearching(false);
        }
    };

    const handleAssignTrainer = async () => {
        if (!trainerProfile) return;

        setIsAssigning(true);
        try {
            await memberService.requestTrainerAssignment(trainerProfile.trainerAccountId);

            // 요청 목록 새로고침
            const updatedRequests = await memberService.getMyTrainerAssignmentRequests();
            setAssignmentRequests(updatedRequests);

            // Clear the form
            setTrainerPhone('');
            setTrainerProfile(null);
            setSearchError(null);

            Alert.alert('요청 완료', '트레이너에게 배정 요청을 보냈습니다.', [{text: '확인'}]);
        } catch (error: any) {
            console.error('Error assigning trainer:', error);
            Alert.alert(
                '요청 실패',
                error.message || '담당 트레이너 지정 요청에 실패했습니다.',
                [{text: '확인'}]
            );
        } finally {
            setIsAssigning(false);
        }
    };

    // 요청 상태에 따른 배지 색상
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return '#F59E0B';
            case 'REJECTED':
                return '#EF4444';
            case 'ACCEPTED':
                return '#10B981';
            default:
                return '#6B7280';
        }
    };

    // 요청 상태 텍스트
    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING':
                return '대기중';
            case 'REJECTED':
                return '거절됨';
            case 'ACCEPTED':
                return '수락됨';
            default:
                return status;
        }
    };

    // PENDING 상태의 요청이 있는지 확인
    const hasPendingRequest = assignmentRequests.some(req => req.status === 'PENDING');

    // 가장 최근 거절된 요청 찾기
    const rejectedRequests = assignmentRequests.filter(req => req.status === 'REJECTED');
    const latestRejectedRequest = rejectedRequests.length > 0 ? rejectedRequests[0] : null;

    // Show loading while checking for existing requests
    if (isCheckingRequest) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>확인 중...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{flex: 1, backgroundColor: 'white'}}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <SafeAreaView style={styles.container}>
                    {/* Title at the top */}
                    <View style={styles.header}>
                        <Text style={styles.title}>담당 트레이너를 지정해주세요</Text>
                        <Text style={styles.subtitle}>
                            {hasPendingRequest
                                ? '트레이너의 응답을 기다리고 있습니다'
                                : latestRejectedRequest
                                ? '요청이 거절되었습니다. 다른 트레이너를 검색해보세요'
                                : '트레이너 전화번호로 검색하세요'}
                        </Text>
                    </View>

                    {/* Content Area */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* 대기 중인 요청이 있는 경우 */}
                        {hasPendingRequest ? (
                            <View style={styles.pendingContainer}>
                                <View style={styles.pendingCard}>
                                    <Ionicons name="time-outline" size={48} color="#F59E0B" />
                                    <Text style={styles.pendingTitle}>대기 중인 요청이 있습니다</Text>
                                    <Text style={styles.pendingMessage}>
                                        트레이너의 응답을 기다리고 있습니다.
                                    </Text>
                                </View>

                                {/* 대기 중인 요청 목록 */}
                                {assignmentRequests
                                    .filter(req => req.status === 'PENDING')
                                    .map((request) => (
                                        <View key={request.requestId} style={styles.requestCard}>
                                            <View style={styles.requestHeader}>
                                                <View style={styles.requestInfo}>
                                                    <Text style={styles.requestTrainerName}>{request.trainerName}</Text>
                                                    <Text style={styles.requestDate}>
                                                        {new Date(request.requestedAt).toLocaleDateString('ko-KR', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </Text>
                                                </View>
                                                <View
                                                    style={[
                                                        styles.statusBadge,
                                                        {backgroundColor: getStatusColor(request.status)}
                                                    ]}
                                                >
                                                    <Text style={styles.statusBadgeText}>
                                                        {getStatusText(request.status)}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                            </View>
                        ) : (
                            /* 대기 중인 요청이 없는 경우 - 검색 가능 */
                            <View>
                                {/* 거절된 요청이 있으면 알림 표시 */}
                                {latestRejectedRequest && (
                                    <View style={styles.rejectionAlert}>
                                        <View style={styles.rejectionHeader}>
                                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                                            <Text style={styles.rejectionTitle}>
                                                {latestRejectedRequest.trainerName} 트레이너가 거절했습니다
                                            </Text>
                                        </View>
                                        {latestRejectedRequest.rejectReason && (
                                            <Text style={styles.rejectionReason}>
                                                {latestRejectedRequest.rejectReason}
                                            </Text>
                                        )}
                                    </View>
                                )}

                                {/* 검색 영역 - 항상 표시 */}
                                <View style={styles.searchSection}>
                                    <Text style={styles.searchLabel}>
                                        {latestRejectedRequest ? '다른 트레이너 검색하기' : '트레이너 검색'}
                                    </Text>

                                    <View style={styles.phoneInputContainer}>
                                        <TextInput
                                            style={styles.phoneInput}
                                            placeholder="010-0000-0000"
                                            placeholderTextColor="#999"
                                            value={formatPhoneNumber(trainerPhone)}
                                            onChangeText={handlePhoneChange}
                                            keyboardType="phone-pad"
                                            maxLength={13}
                                            autoFocus={true}
                                            editable={!isAssigning}
                                        />
                                        {isSearching && (
                                            <ActivityIndicator
                                                size="small"
                                                color="#3B82F6"
                                                style={styles.searchingIndicator}
                                            />
                                        )}
                                    </View>

                                    {searchError && (
                                        <View style={styles.errorCard}>
                                            <Ionicons name="alert-circle" size={20} color="#EF4444"/>
                                            <Text style={styles.errorText}>{searchError}</Text>
                                        </View>
                                    )}

                                    {trainerProfile && (
                                        <View style={styles.profileCard}>
                                            <View style={styles.profileHeader}>
                                                <View style={styles.profileIcon}>
                                                    {trainerProfile.profileImageUrl ? (
                                                        <Image
                                                            source={{uri: trainerProfile.profileImageUrl}}
                                                            style={styles.profileImage}
                                                        />
                                                    ) : (
                                                        <Ionicons name="person-circle" size={60} color="#3B82F6"/>
                                                    )}
                                                </View>
                                                <View style={styles.profileInfo}>
                                                    <Text style={styles.profileName}>{trainerProfile.name}</Text>
                                                    <Text style={styles.profilePhone}>
                                                        {formatPhoneNumber(trainerProfile.phoneNumber || '')}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Fixed bottom button area */}
                    {trainerProfile && !hasPendingRequest && (
                        <View style={styles.bottomButtonContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.assignButton,
                                    isAssigning && styles.assignButtonDisabled
                                ]}
                                onPress={handleAssignTrainer}
                                disabled={isAssigning || !trainerProfile}
                            >
                                {isAssigning ? (
                                    <ActivityIndicator color="white"/>
                                ) : (
                                    <Text style={styles.assignButtonText}>담당 트레이너 지정 요청</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    header: {
        marginTop: 40,
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#3B82F6',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    // 대기 중인 요청 스타일
    pendingContainer: {
        alignItems: 'center',
    },
    pendingCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FDE68A',
        width: '100%',
    },
    pendingTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#92400E',
        marginTop: 12,
        marginBottom: 8,
    },
    pendingMessage: {
        fontSize: 14,
        color: '#92400E',
        textAlign: 'center',
    },
    // 거절 알림 스타일
    rejectionAlert: {
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#EF4444',
    },
    rejectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    rejectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#DC2626',
        flex: 1,
    },
    rejectionReason: {
        fontSize: 14,
        color: '#991B1B',
        lineHeight: 20,
        marginLeft: 36,
    },
    // 검색 영역 스타일
    searchSection: {
        width: '100%',
    },
    searchLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    phoneInputContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    phoneInput: {
        borderWidth: 2,
        borderColor: '#3B82F6',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
    },
    searchingIndicator: {
        position: 'absolute',
        right: 16,
        top: 16,
    },
    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        flex: 1,
        fontWeight: '600',
    },
    profileCard: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 20,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileIcon: {
        marginRight: 16,
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    profilePhone: {
        fontSize: 14,
        color: '#666',
    },
    // 요청 카드 스타일
    requestCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        width: '100%',
    },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    requestInfo: {
        flex: 1,
        marginRight: 12,
    },
    requestTrainerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    requestDate: {
        fontSize: 13,
        color: '#6B7280',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    // 버튼 스타일
    bottomButtonContainer: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        paddingTop: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    assignButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    assignButtonDisabled: {
        backgroundColor: '#E0E0E0',
    },
    assignButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
});
