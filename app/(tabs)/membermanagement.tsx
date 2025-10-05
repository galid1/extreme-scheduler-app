import React, {useEffect} from 'react';
import {SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {trainerService} from "@/src/services/api";
import {useAssignmentStore} from "@/src/store/useAssignmentStore";
import {useAssignedMembersStore} from "@/src/store/useAssignedMembersStore";

export default function MemberManagementScreen() {
    const {assignmentRequests, setAssignmentRequests, setIsLoadingRequests} = useAssignmentStore();
    const { members } = useAssignedMembersStore();
    const router = useRouter();

    // Fetch trainer assignment requests
    useEffect(() => {
        fetchAssignmentRequests();
    }, []);


    const fetchAssignmentRequests = async () => {
        setIsLoadingRequests(true);
        try {
            const response = await trainerService.getAssignmentRequests();
            setAssignmentRequests(response.content);
        } catch (error) {
            console.error('Error fetching assignment requests:', error);
        } finally {
            setIsLoadingRequests(false);
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>회원관리</Text>
                <TouchableOpacity
                    onPress={() => router.push('/profile')}
                    style={styles.settingsButton}
                >
                    <Ionicons name="settings-outline" size={24} color="black"/>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Show trainer dashboard or schedule management */}
                <>
                    <View style={styles.trainerDashboard}>
                        <Text style={styles.dashboardTitle}>담당 회원 대시보드</Text>
                        <View style={styles.statsContainer}>
                            <TouchableOpacity
                                style={styles.statCard}
                                onPress={() => router.push('/approved-members')}
                            >
                                <Text style={styles.statNumber}>{members.length}</Text>
                                <Text style={styles.statLabel}>회원</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.statCard}
                                onPress={() => router.push('/assignment-requests')}
                            >
                                <Text style={styles.statNumber}>
                                    {assignmentRequests.filter(req => req.status === 'PENDING').length}
                                </Text>
                                <Text style={styles.statLabel}>대기중 요청</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1F2937',
    },
    settingsButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 100,
    },
    trainerDashboard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#3B82F6',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    dashboardTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statCard: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'white',
        minWidth: 100,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: '700',
        color: '#3B82F6',
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 4,
        borderBottomWidth: 1,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardText: {
        color: '#6B7280',
        fontSize: 14,
    },
});
