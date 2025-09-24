import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/useAuthStore';
import ProfileCard from '@/src/components/ProfileCard';

interface TrainerProfile {
  id: string;
  name: string;
  phoneNumber: string;
  experience: string;
  specialties: string[];
  rating: number;
  memberCount?: number;
  todaySchedule?: number;
}

export default function TrainerProfileScreen() {
  const router = useRouter();
  const { trainerAccountId } = useAuthStore();
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrainerProfile();
  }, [trainerAccountId]);

  const fetchTrainerProfile = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock trainer data
      setTrainerProfile({
        id: trainerAccountId || 'trainer_001',
        name: '김트레이너',
        phoneNumber: '010-1234-5678',
        experience: '5년 경력',
        specialties: ['웨이트 트레이닝', '다이어트', '재활'],
        rating: 4.8,
        memberCount: 12,
        todaySchedule: 8,
      });
    } catch (error) {
      console.error('Error fetching trainer profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    // Implement phone call functionality
    console.log('Calling trainer:', trainerProfile?.phoneNumber);
  };

  const handleMessage = () => {
    // Implement messaging functionality
    console.log('Messaging trainer');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>담당 트레이너</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!trainerProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>담당 트레이너</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>트레이너 정보를 불러올 수 없습니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>담당 트레이너</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileSection}>
          <ProfileCard
            name={trainerProfile.name}
            phoneNumber={trainerProfile.phoneNumber}
            accountType="TRAINER"
            experience={trainerProfile.experience}
            specialties={trainerProfile.specialties}
            rating={trainerProfile.rating}
            backgroundColor="rgba(255,255,255,0.1)"
            textColor="white"
          />
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#3B82F6" />
            <Text style={styles.statNumber}>{trainerProfile.memberCount}</Text>
            <Text style={styles.statLabel}>회원</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#3B82F6" />
            <Text style={styles.statNumber}>{trainerProfile.todaySchedule}</Text>
            <Text style={styles.statLabel}>오늘 일정</Text>
          </View>
        </View>

        {/* Contact Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={20} color="white" />
            <Text style={styles.actionButtonText}>전화하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
            <Ionicons name="chatbubble" size={20} color="white" />
            <Text style={styles.actionButtonText}>메시지</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>운동 일정</Text>
          <TouchableOpacity style={styles.infoCard}>
            <View style={styles.infoCardContent}>
              <Ionicons name="time" size={20} color="#3B82F6" />
              <Text style={styles.infoCardText}>다음 수업: 오늘 오후 3:00</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>운동 기록</Text>
          <TouchableOpacity style={styles.infoCard}>
            <View style={styles.infoCardContent}>
              <Ionicons name="analytics" size={20} color="#3B82F6" />
              <Text style={styles.infoCardText}>이번 달 운동 기록 보기</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#333',
    fontSize: 16,
  },
  profileSection: {
    margin: 20,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoCardText: {
    color: '#333',
    fontSize: 14,
  },
});