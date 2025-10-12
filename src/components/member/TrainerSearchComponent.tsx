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
    onAssignmentSuccess: (trainerAccountId: number) => void;
}

export default function TrainerSearchComponent({
                                                   onAssignmentSuccess,
                                               }: TrainerSearchComponentProps) {
    const [trainerPhone, setTrainerPhone] = useState('');
    const [trainerProfile, setTrainerProfile] = useState<TrainerSearchResponse | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

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

            Alert.alert(
                '요청 완료',
                '담당 트레이너 지정 요청이 전송되었습니다. 트레이너가 승인하면 일정 등록이 가능합니다.',
                [
                    {
                        text: '확인',
                        onPress: () => {
                            onAssignmentSuccess(trainerProfile.trainerAccountId);
                        },
                    },
                ]
            );

            // Clear the form
            setTrainerPhone('');
            setTrainerProfile(null);
            setSearchError(null);
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

    return (
        <KeyboardAvoidingView
            style={{flex: 1, backgroundColor: '#F8FAFC'}}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <SafeAreaView style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>담당 트레이너를 지정해주세요</Text>
                        </View>

                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>트레이너 전화번호로 검색하세요</Text>

                            <View style={styles.phoneInputContainer}>
                                <TextInput
                                    style={styles.phoneInput}
                                    placeholder="010-0000-0000"
                                    placeholderTextColor="#9CA3AF"
                                    value={formatPhoneNumber(trainerPhone)}
                                    onChangeText={handlePhoneChange}
                                    keyboardType="phone-pad"
                                    maxLength={13}
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
                                                <Ionicons name="person-circle" size={50} color="#3B82F6"/>
                                            )}
                                        </View>
                                        <View style={styles.profileInfo}>
                                            <Text style={styles.profileName}>{trainerProfile.name}</Text>
                                            <Text style={styles.profilePhone}>
                                                {formatPhoneNumber(trainerProfile.phoneNumber)}
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.assignButton, isAssigning && styles.assignButtonDisabled]}
                                        onPress={handleAssignTrainer}
                                        disabled={isAssigning || !trainerProfile}
                                    >
                                        {isAssigning ? (
                                            <ActivityIndicator color="white"/>
                                        ) : (
                                            <>
                                                <Ionicons name="person-add" size={20} color="white"/>
                                                <Text style={styles.assignButtonText}>담당 트레이너 지정 요청</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        marginBottom: 30,
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    inputSection: {
        marginTop: 20,
    },
    inputLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 12,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginTop: 12,
    },
    phoneInput: {
        flex: 1,
        fontSize: 18,
        color: '#1F2937',
        paddingVertical: 12,
    },
    searchingIndicator: {
        marginLeft: 12,
    },
    profileCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    profileHeader: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    profileIcon: {
        marginRight: 16,
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    profilePhone: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    assignButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
    },
    assignButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    assignButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    errorCard: {
        flexDirection: 'row',
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        flex: 1,
    },
});
