import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {AccountType} from '@/src/types/enums';

interface ProfileCardProps {
    name: string;
    profileImageUrl?: string;
    phoneNumber?: string;
    accountType?: AccountType;
}

export default function ProfileCard({
                                        name,
                                        profileImageUrl,
                                        phoneNumber,
                                        accountType,
                                    }: ProfileCardProps) {
    return (
        <View style={[styles.container]}>
            <View style={styles.profileHeader}>
                <View style={styles.profileIcon}>
                    {profileImageUrl ? (
                        <Image
                            source={{uri: profileImageUrl}}
                            style={styles.profileImage}
                        />
                    ) : (
                        <View style={styles.profileIconPlaceholder}>
                            <Ionicons name="person" size={50} color="#3B82F6"/>
                        </View>
                    )}
                </View>
                <View style={styles.profileInfo}>
                    <Text style={[styles.userName]}>{name}</Text>
                    {phoneNumber && (
                        <Text style={[styles.userPhone]}>
                            {phoneNumber}
                        </Text>
                    )}
                    {accountType && (
                        <View style={styles.accountTypeBadge}>
                            <Text style={[styles.accountTypeText]}>
                                {accountType === AccountType.TRAINER ? '트레이너' : '회원'}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        borderColor: "#E5E7EB",
        borderWidth: 0.3
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    profileIcon: {
        marginRight: 16,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    profileIconPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 14,
        marginBottom: 8,
    },
    accountTypeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginTop: 4,
    },
    accountTypeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    detailSection: {
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 12,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 16,
    },
});
