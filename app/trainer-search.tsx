import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { memberService } from '@/src/services/api';
import { useAuthStore } from '@/src/store/useAuthStore';
import type { TrainerInfo } from '@/src/types/api';

export default function TrainerSearchScreen() {
  const router = useRouter();
  const { accountId } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trainerInfo, setTrainerInfo] = useState<TrainerInfo | null>(null);
  const [isAlreadyAssigned, setIsAlreadyAssigned] = useState(false);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return text;
  };

  const handlePhoneNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      setPhoneNumber(formatPhoneNumber(cleaned));
    }
  };

  const handleSearch = async () => {
    if (!phoneNumber) {
      Alert.alert('알림', '트레이너 전화번호를 입력해주세요.');
      return;
    }

    const cleanedNumber = phoneNumber.replace(/\D/g, '');
    if (cleanedNumber.length !== 11) {
      Alert.alert('알림', '올바른 전화번호 형식을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setTrainerInfo(null);

    try {
      const response = await memberService.searchTrainer(phoneNumber);
      setTrainerInfo(response.trainer);
      setIsAlreadyAssigned(response.isAlreadyAssigned);
    } catch (error: any) {
      console.error('Trainer search error:', error);
      Alert.alert(
        '검색 실패',
        error.message || '트레이너를 찾을 수 없습니다. 전화번호를 확인해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAssignment = async () => {
    if (!trainerInfo) return;

    if (isAlreadyAssigned) {
      Alert.alert('알림', '이미 해당 트레이너와 연결되어 있습니다.');
      return;
    }

    setIsLoading(true);

    try {
      await memberService.requestTrainerAssignment(trainerInfo.accountId);
      Alert.alert(
        '요청 완료',
        '트레이너에게 담당 요청을 보냈습니다. 승인을 기다려주세요.',
        [
          {
            text: '확인',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Assignment request error:', error);
      Alert.alert(
        '요청 실패',
        error.message || '요청을 보내는데 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>트레이너 검색</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.searchSection}>
          <Text style={styles.label}>트레이너 전화번호</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="010-0000-0000"
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              keyboardType="phone-pad"
              maxLength={13}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.searchButton, isLoading && styles.buttonDisabled]}
            onPress={handleSearch}
            disabled={isLoading || !phoneNumber}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="white" />
                <Text style={styles.searchButtonText}>검색</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {trainerInfo && (
          <View style={styles.resultSection}>
            <View style={styles.trainerCard}>
              <View style={styles.trainerHeader}>
                <Ionicons name="person-circle" size={60} color="#3B82F6" />
                <View style={styles.trainerInfo}>
                  <Text style={styles.trainerName}>{trainerInfo.name}</Text>
                  <Text style={styles.trainerPhone}>{trainerInfo.phoneNumber}</Text>
                  {trainerInfo.experience && (
                    <Text style={styles.trainerExperience}>{trainerInfo.experience}</Text>
                  )}
                </View>
              </View>

              {trainerInfo.specialties && trainerInfo.specialties.length > 0 && (
                <View style={styles.specialties}>
                  <Text style={styles.specialtiesTitle}>전문 분야</Text>
                  <View style={styles.specialtyTags}>
                    {trainerInfo.specialties.map((specialty, index) => (
                      <View key={index} style={styles.specialtyTag}>
                        <Text style={styles.specialtyText}>{specialty}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {trainerInfo.rating && (
                <View style={styles.rating}>
                  <Ionicons name="star" size={16} color="#FFC107" />
                  <Text style={styles.ratingText}>{trainerInfo.rating.toFixed(1)}</Text>
                  {trainerInfo.memberCount !== undefined && (
                    <Text style={styles.memberCount}>
                      • 회원 {trainerInfo.memberCount}명
                    </Text>
                  )}
                </View>
              )}

              {isAlreadyAssigned && (
                <View style={styles.assignedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.assignedText}>현재 담당 트레이너</Text>
                </View>
              )}
            </View>

            {!isAlreadyAssigned && (
              <TouchableOpacity
                style={[styles.requestButton, isLoading && styles.buttonDisabled]}
                onPress={handleRequestAssignment}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={20} color="white" />
                    <Text style={styles.requestButtonText}>담당 트레이너 요청</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
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
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  resultSection: {
    flex: 1,
  },
  trainerCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  trainerHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  trainerInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  trainerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  trainerPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  trainerExperience: {
    fontSize: 14,
    color: '#6B7280',
  },
  specialties: {
    marginBottom: 12,
  },
  specialtiesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  specialtyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  specialtyText: {
    fontSize: 12,
    color: '#1F2937',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  memberCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  assignedText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  requestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});