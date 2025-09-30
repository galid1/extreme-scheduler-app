import React, {useEffect, useState} from 'react';
import {ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useAuthStore} from '@/src/store/useAuthStore';
import ProfileCard from '@/src/components/ProfileCard';
import memberService from "@/src/services/api/member.service";
import {TrainerSearchResponse} from "@/src/types/api";

export default function TrainerProfileScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [trainerProfile, setTrainerProfile] = useState<TrainerSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrainerProfile();
  }, [member?.trainerAccountId]);

  const fetchTrainerProfile = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual API
      const response = await memberService.getAssignedTrainer()
      setTrainerProfile(response)
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
          profileImageUrl={trainerProfile.profileImageUrl}
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
    fontWeight: '700',
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
