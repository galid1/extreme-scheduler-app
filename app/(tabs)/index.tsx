import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useAuthStore } from '@/src/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

interface TrainerProfile {
  id: string;
  name: string;
  phoneNumber: string;
  experience: string;
  specialties: string[];
  rating: number;
}

export default function HomeScreen() {
  const { accountType, trainerAccountId, setTrainerAccountId, name } = useAuthStore();
  const [trainerPhone, setTrainerPhone] = useState('');
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

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
    }
  };

  // Auto search when 11 digits are entered
  useEffect(() => {
    if (trainerPhone.length === 11) {
      searchTrainer();
    } else {
      setTrainerProfile(null);
    }
  }, [trainerPhone]);

  const searchTrainer = async () => {
    setIsSearching(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock trainer data
      setTrainerProfile({
        id: 'trainer_001',
        name: '김트레이너',
        phoneNumber: trainerPhone,
        experience: '5년 경력',
        specialties: ['웨이트 트레이닝', '다이어트', '재활'],
        rating: 4.8,
      });
    } catch (error) {
      console.error('Error searching trainer:', error);
      setTrainerProfile(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssignTrainer = async () => {
    if (!trainerProfile) return;

    setIsAssigning(true);
    try {
      // Mock API call to assign trainer
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update store with trainer ID
      setTrainerAccountId(trainerProfile.id);

      // Clear the form
      setTrainerPhone('');
      setTrainerProfile(null);
    } catch (error) {
      console.error('Error assigning trainer:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  // Show trainer assignment UI only for MEMBER accounts without a trainer
  if (accountType === 'MEMBER' && !trainerAccountId) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#3B82F6' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.header}>
                <Text style={styles.title}>담당 트레이너를 지정해주세요</Text>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>담당 트레이너의 전화번호를 입력하세요</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="010-0000-0000"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  keyboardType="number-pad"
                  value={formatPhoneNumber(trainerPhone)}
                  onChangeText={handlePhoneChange}
                  maxLength={13}
                />

                {isSearching && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="white" />
                    <Text style={styles.loadingText}>트레이너 정보를 검색중입니다...</Text>
                  </View>
                )}

                {trainerProfile && !isSearching && (
                  <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                      <View style={styles.profileIcon}>
                        <Ionicons name="person-circle" size={60} color="white" />
                      </View>
                      <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{trainerProfile.name}</Text>
                        <Text style={styles.profileExperience}>{trainerProfile.experience}</Text>
                        <View style={styles.ratingContainer}>
                          <Ionicons name="star" size={16} color="#FFD700" />
                          <Text style={styles.ratingText}>{trainerProfile.rating}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.specialtiesContainer}>
                      <Text style={styles.specialtiesTitle}>전문 분야</Text>
                      <View style={styles.specialtiesList}>
                        {trainerProfile.specialties.map((specialty, index) => (
                          <View key={index} style={styles.specialtyTag}>
                            <Text style={styles.specialtyText}>{specialty}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={handleAssignTrainer}
                      disabled={isAssigning}
                    >
                      {isAssigning ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text style={styles.confirmButtonText}>확인</Text>
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

  // Default home screen for trainers or members with assigned trainer
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>안녕하세요, {name}님!</Text>
        </View>

        {accountType === 'MEMBER' && trainerAccountId && (
          <View style={styles.assignedTrainerCard}>
            <Text style={styles.assignedTrainerTitle}>담당 트레이너</Text>
            <Text style={styles.assignedTrainerName}>김트레이너</Text>
            <TouchableOpacity style={styles.changeTrainerButton}>
              <Text style={styles.changeTrainerText}>트레이너 변경</Text>
            </TouchableOpacity>
          </View>
        )}

        {accountType === 'TRAINER' && (
          <View style={styles.trainerDashboard}>
            <Text style={styles.dashboardTitle}>트레이너 대시보드</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>회원</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>오늘 일정</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B82F6',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: 'white',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  inputSection: {
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 12,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: 'white',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 14,
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  profileIcon: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  profileExperience: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
  },
  specialtiesContainer: {
    marginBottom: 20,
  },
  specialtiesTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginBottom: 10,
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  specialtyText: {
    color: 'white',
    fontSize: 12,
  },
  confirmButton: {
    backgroundColor: '#5B99F7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  assignedTrainerCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  assignedTrainerTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  assignedTrainerName: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  changeTrainerButton: {
    alignSelf: 'flex-start',
  },
  changeTrainerText: {
    color: '#5B99F7',
    fontSize: 14,
  },
  trainerDashboard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '600',
    color: 'white',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
});
