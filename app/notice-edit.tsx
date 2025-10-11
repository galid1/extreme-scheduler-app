import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trainerNoticeService } from '@/src/services/api';

export default function NoticeEditScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const noticeId = params.noticeId ? Number(params.noticeId) : null;
    const isEditMode = noticeId !== null;

    const [title, setTitle] = useState(params.title as string || '');
    const [content, setContent] = useState(params.content as string || '');
    const [fixed, setFixed] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('알림', '제목을 입력해주세요.');
            return;
        }
        if (!content.trim()) {
            Alert.alert('알림', '내용을 입력해주세요.');
            return;
        }

        setIsSaving(true);
        try {
            if (isEditMode) {
                // 수정 모드
                await trainerNoticeService.updateNotice(noticeId!, {
                    title: title.trim(),
                    content: content.trim(),
                });
            } else {
                // 작성 모드
                await trainerNoticeService.createNotice({
                    title: title.trim(),
                    content: content.trim(),
                    fixed: fixed,
                });
            }
            // 저장 성공 시 바로 뒤로가기
            router.back();
        } catch (error) {
            console.error('Error saving notice:', error);
            Alert.alert('오류', `공지사항 ${isEditMode ? '수정' : '작성'}에 실패했습니다.`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isEditMode ? '공지사항 수정' : '공지사항 작성'}
                    </Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveButton}
                        disabled={isSaving}
                    >
                        <Text style={[
                            styles.saveButtonText,
                            isSaving && styles.saveButtonTextDisabled
                        ]}>
                            {isSaving ? '저장중...' : '저장'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.keyboardAvoid}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <ScrollView
                        style={styles.content}
                        keyboardShouldPersistTaps="handled"
                        removeClippedSubviews={false}
                    >
                        {/* Title Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>제목</Text>
                            <TextInput
                                style={styles.titleInput}
                                placeholder="공지사항 제목을 입력하세요"
                                value={title}
                                onChangeText={setTitle}
                                maxLength={100}
                                autoCorrect={false}
                                autoComplete="off"
                            />
                            <Text style={styles.charCount}>{title.length}/100</Text>
                        </View>

                        {/* Content Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>내용</Text>
                            <TextInput
                                style={styles.contentInput}
                                placeholder="공지사항 내용을 입력하세요"
                                value={content}
                                onChangeText={setContent}
                                multiline
                                textAlignVertical="top"
                                maxLength={1000}
                                autoCorrect={false}
                                autoComplete="off"
                            />
                            <Text style={styles.charCount}>{content.length}/1000</Text>
                        </View>

                        {/* Fixed Checkbox (작성 모드만) */}
                        {!isEditMode && (
                            <View style={styles.checkboxContainer}>
                                <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => setFixed(!fixed)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        styles.checkboxBox,
                                        fixed && styles.checkboxBoxChecked
                                    ]}>
                                        {fixed && (
                                            <Ionicons name="checkmark" size={18} color="white" />
                                        )}
                                    </View>
                                    <Text style={styles.checkboxLabel}>상단 고정</Text>
                                </TouchableOpacity>
                                <Text style={styles.checkboxDescription}>
                                    고정된 공지는 목록 최상단에 표시됩니다
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    keyboardAvoid: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    saveButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3B82F6',
    },
    saveButtonTextDisabled: {
        color: '#9CA3AF',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    titleInput: {
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
    },
    contentInput: {
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
        minHeight: 200,
    },
    charCount: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 4,
    },
    checkboxContainer: {
        marginBottom: 24,
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    checkboxBox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        backgroundColor: 'white',
    },
    checkboxBoxChecked: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    checkboxLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    checkboxDescription: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 36,
    },
});
