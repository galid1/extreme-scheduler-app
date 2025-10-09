import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MemberScheduleActionsProps {
    currentWeek: number;
}

export default function MemberScheduleActions({
    currentWeek,
}: MemberScheduleActionsProps) {
    const handleCancelRequest = async () => {
        // TODO: 구현 예정
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelRequest}
            >
                <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color="white"
                />
                <Text style={styles.cancelButtonText}>
                    일정 취소 요청하기
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
});
