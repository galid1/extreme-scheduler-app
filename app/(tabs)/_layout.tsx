import {Tabs} from 'expo-router';
import React, {useEffect} from 'react';
import {Ionicons} from '@expo/vector-icons';
import {View, Text, StyleSheet} from 'react-native';

import {HapticTab} from '@/components/haptic-tab';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {Colors} from '@/constants/theme';
import {useColorScheme} from '@/hooks/use-color-scheme';
import {useAuthStore} from '@/src/store/useAuthStore';
import {AccountType} from '@/src/types/enums';
import {useAssignmentStore} from '@/src/store/useAssignmentStore';
import {trainerService} from '@/src/services/api';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const {account} = useAuthStore();
    const accountType = account?.accountType;
    const {assignmentRequests, setAssignmentRequests, setIsLoadingRequests} = useAssignmentStore();

    // Fetch assignment requests when layout mounts (only for trainers)
    useEffect(() => {
        const fetchAssignmentRequests = async () => {
            if (accountType !== AccountType.TRAINER) {
                return;
            }

            setIsLoadingRequests(true);
            try {
                const response = await trainerService.getAssignmentRequests();
                setAssignmentRequests(response.content);
            } catch (error) {
                console.error('Error fetching assignment requests in tab layout:', error);
            } finally {
                setIsLoadingRequests(false);
            }
        };

        fetchAssignmentRequests();
    }, [accountType]);

    // Calculate pending requests count
    const pendingRequestsCount = assignmentRequests.filter(req => req.status === 'PENDING').length;

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
                tabBarButton: HapticTab,
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: '스케줄관리',
                    tabBarIcon: ({color}) => <Ionicons name="time-outline" size={28} color={color}/>,
                }}
            />
            <Tabs.Screen
                name="membermanagement"
                options={{
                    href: accountType === AccountType.TRAINER ? '/membermanagement' : null,
                    title: '회원관리',
                    tabBarIcon: ({color}) => (
                        <View style={styles.tabIconContainer}>
                            <Ionicons name="people" size={28} color={color}/>
                            {pendingRequestsCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="myprofile"
                options={{
                    title: '내정보',
                    tabBarIcon: ({color}) => <IconSymbol name="person.fill" size={28} color={color}/>,
                }}
            />
            {/* Hide other files from tabs */}
            <Tabs.Screen
                name="member/MemberHome"
                options={{
                    href: null, // This hides the tab
                }}
            />
            <Tabs.Screen
                name="trainer/TrainerHome"
                options={{
                    href: null, // This hides the tab
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabIconContainer: {
        position: 'relative',
        width: 28,
        height: 28,
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -10,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: 'white',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
});
