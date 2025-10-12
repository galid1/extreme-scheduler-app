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
import type {TrainerSearchResponse} from '@/src/types/api';

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

                // Check if there are any requests (non-empty array)
                if (requests && requests.length > 0) {
                    console.log('[TrainerSearchComponent] Requests exist, calling onAssignmentSuccess');
                    // Request exists, trigger refresh to show MemberPendingAssignmentScreen
                    onAssignmentSuccess();
                } else {
                    console.log('[TrainerSearchComponent] No requests found (empty array)');
                }
            } catch (error: any) {
                console.log('[TrainerSearchComponent] Error or no request:', error);
                console.log('[TrainerSearchComponent] Error status:', error?.response?.status);
                console.log('[TrainerSearchComponent] Error message:', error?.message);
            } finally {
                console.log('[TrainerSearchComponent] Check complete, setting isCheckingRequest to false');
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

            // Clear the form first
            setTrainerPhone('');
            setTrainerProfile(null);
            setSearchError(null);

            Alert.alert(
                '요청 완료',
                '담당 트레이너 지정 요청이 전송되었습니다. 트레이너가 승인하면 일정 등록이 가능합니다.',
                [
                    {
                        text: '확인',
                        onPress: () => {
                            onAssignmentSuccess();
                        },
                    },
                ]
            );
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
                        <Text style={styles.subtitle}>트레이너 전화번호로 검색하세요</Text>
                    </View>

                    {/* Scrollable content area */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>전화번호</Text>

                            <View style={styles.phoneInputContainer}>
                                <TextInput
                                    style={styles.phoneInput}
                                    placeholder="010-0000-0000"
                                    placeholderTextColor="#999"
                                    value={formatPhoneNumber(trainerPhone)}
                                    onChangeText={handlePhoneChange}
                                    keyboardType="phone-pad"
                                    maxLength={13}
                                    autoFocus
                                />
                                {isSearching && (
                                    <ActivityIndicator size="small" color="#3B82F6" style={styles.searchingIndicator}/>
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
                                                {formatPhoneNumber(trainerProfile.phoneNumber)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Fixed bottom button area */}
                    {trainerProfile && (
                        <View style={styles.bottomButtonContainer}>
                            <TouchableOpacity
                                style={[styles.assignButton, isAssigning && styles.assignButtonDisabled]}
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
    inputSection: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 12,
        fontWeight: '600',
    },
    phoneInputContainer: {
        position: 'relative',
    },
    phoneInput: {
        borderWidth: 1,
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
        marginTop: 12,
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
        marginTop: 20,
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
