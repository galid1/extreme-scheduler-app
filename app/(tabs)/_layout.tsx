import {Tabs} from 'expo-router';
import React from 'react';
import {Ionicons} from '@expo/vector-icons';

import {HapticTab} from '@/components/haptic-tab';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {Colors} from '@/constants/theme';
import {useColorScheme} from '@/hooks/use-color-scheme';
import {useAuthStore} from '@/src/store/useAuthStore';
import {AccountType} from '@/src/types/enums';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const {account} = useAuthStore();
    const accountType = account?.accountType;

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
                    tabBarIcon: ({color}) => <Ionicons name="people" size={28} color={color}/>,
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
                name="index-backup"
                options={{
                    href: null, // This hides the tab
                }}
            />
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
