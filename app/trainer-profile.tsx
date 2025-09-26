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
      });
    } catch (error) {
      console.error('Error fetching trainer profile:', error);
    } finally {
      setIsLoading(false);
    }
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

      <View style={styles.content}>
        <ProfileCard
          name={trainerProfile.name}
          phoneNumber={trainerProfile.phoneNumber}
          accountType="TRAINER"
          experience={trainerProfile.experience}
          specialties={trainerProfile.specialties}
          rating={trainerProfile.rating}
          backgroundColor="#3B82F6"
          textColor="white"
        />
      </View>
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
    padding: 20,
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
});