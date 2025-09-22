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
import { useRouter } from 'expo-router';

interface TrainerProfile {
  id: string;
  name: string;
  phoneNumber: string;
  experience: string;
  specialties: string[];
  rating: number;
}

type TimeSlotState = 'none' | 'once' | 'recurring';

interface TimeSlotSelection {
  hour: number;
  state: TimeSlotState;
}

export default function HomeScreen() {
  const router = useRouter();
  const { accountType, trainerAccountId, setTrainerAccountId, name, scheduleStatus, setScheduleStatus } = useAuthStore();
  const [trainerPhone, setTrainerPhone] = useState('');
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<{ [key: string]: TimeSlotSelection[] }>({});
  const [showScheduleEdit, setShowScheduleEdit] = useState(false);
  const [savedSchedule, setSavedSchedule] = useState<{ [key: string]: TimeSlotSelection[] }>({});

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

  // Show schedule registration as full page for NOT_READY status or when editing
  if (accountType === 'MEMBER' && trainerAccountId && (scheduleStatus === 'NOT_READY' || showScheduleEdit)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scheduleHeader}>
          {showScheduleEdit && (
            <TouchableOpacity
              style={styles.scheduleBackButton}
              onPress={() => {
                setShowScheduleEdit(false);
                // Restore saved schedule when cancelling edit
                setSelectedTimes(savedSchedule);
                setExpandedDay(null);
              }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          )}
          <Text style={styles.schedulePageTitle}>
            {showScheduleEdit ? '일정 수정 요청' : '차주의 원하는 일정을 등록하세요'}
          </Text>
          <Text style={styles.scheduleSubtitle}>트레이너가 확인 후 일정을 확정해드립니다</Text>
          <View style={styles.helpContainer}>
            <View style={styles.helpItem}>
              <View style={[styles.helpIndicator, { backgroundColor: 'rgba(91, 153, 247, 0.3)' }]}>
                <Text style={styles.helpIndicatorText}>일회</Text>
              </View>
              <Text style={styles.helpText}>한 번만</Text>
            </View>
            <View style={styles.helpItem}>
              <View style={[styles.helpIndicator, { backgroundColor: 'rgba(139, 92, 246, 0.3)' }]}>
                <Ionicons name="repeat" size={12} color="white" />
                <Text style={styles.helpIndicatorText}>반복</Text>
              </View>
              <Text style={styles.helpText}>매주 반복</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scheduleScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.daysFullContainer}>
            {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
              <View key={day} style={styles.dayFullSection}>
                <TouchableOpacity
                  style={[
                    styles.dayFullButton,
                    expandedDay === day && styles.dayFullButtonActive,
                  ]}
                  onPress={() => setExpandedDay(expandedDay === day ? null : day)}
                >
                  <Text style={[
                    styles.dayFullButtonText,
                    expandedDay === day && styles.dayButtonTextActive,
                  ]}>
                    {day}요일
                  </Text>
                  <Ionicons
                    name={expandedDay === day ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>

                {expandedDay === day && (
                  <View style={styles.timeFullSlots}>
                    <ScrollView style={styles.timeFullSlotsScroll} showsVerticalScrollIndicator={false}>
                      {/* Morning Section */}
                      <View style={styles.timePeriodSection}>
                        <Text style={styles.timePeriodLabel}>오전</Text>
                        {Array.from({ length: 12 }, (_, i) => i).map((hour) => {
                          const timeSlot = selectedTimes[day]?.find(t => t.hour === hour);
                          const state = timeSlot?.state || 'none';
                          const displayHour = hour === 0 ? 12 : hour;

                          return (
                            <TouchableOpacity
                              key={hour}
                              style={[
                                styles.timeFullSlot,
                                state === 'once' && styles.timeSlotOnce,
                                state === 'recurring' && styles.timeSlotRecurring,
                              ]}
                              onPress={() => {
                                const dayTimes = selectedTimes[day] || [];
                                const existingIndex = dayTimes.findIndex(t => t.hour === hour);

                                if (existingIndex >= 0) {
                                  const currentState = dayTimes[existingIndex].state;
                                  if (currentState === 'once') {
                                    // Change to recurring
                                    const updated = [...dayTimes];
                                    updated[existingIndex] = { hour, state: 'recurring' };
                                    setSelectedTimes({ ...selectedTimes, [day]: updated });
                                  } else {
                                    // Remove (recurring -> none)
                                    setSelectedTimes({
                                      ...selectedTimes,
                                      [day]: dayTimes.filter(t => t.hour !== hour),
                                    });
                                  }
                                } else {
                                  // Add as once
                                  setSelectedTimes({
                                    ...selectedTimes,
                                    [day]: [...dayTimes, { hour, state: 'once' }].sort((a, b) => a.hour - b.hour),
                                  });
                                }
                              }}
                            >
                              <View style={styles.timeSlotContent}>
                                <Text style={[
                                  styles.timeFullSlotText,
                                  state !== 'none' && styles.timeSlotTextSelected,
                                ]}>
                                  {hour === 0
                                    ? `오전 12:00 - 01:00`
                                    : `오전 ${displayHour.toString().padStart(2, '0')}:00 - ${(displayHour + 1).toString().padStart(2, '0')}:00`}
                                </Text>
                                <View style={styles.timeSlotStateOptions}>
                                  <View style={[
                                    styles.stateOptionBadge,
                                    state === 'once' && styles.stateOptionActive
                                  ]}>
                                    <Text style={[
                                      styles.stateOptionText,
                                      state === 'once' && styles.stateOptionTextActive
                                    ]}>일회</Text>
                                  </View>
                                  <View style={[
                                    styles.stateOptionBadge,
                                    state === 'recurring' && styles.stateOptionActiveRecurring
                                  ]}>
                                    <Ionicons
                                      name="repeat"
                                      size={14}
                                      color={state === 'recurring' ? 'white' : 'rgba(255,255,255,0.3)'}
                                    />
                                    <Text style={[
                                      styles.stateOptionText,
                                      state === 'recurring' && styles.stateOptionTextActive
                                    ]}>반복</Text>
                                  </View>
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Afternoon/Evening Section */}
                      <View style={styles.timePeriodSection}>
                        <Text style={styles.timePeriodLabel}>오후</Text>
                        {Array.from({ length: 12 }, (_, i) => i + 12).map((hour) => {
                          const timeSlot = selectedTimes[day]?.find(t => t.hour === hour);
                          const state = timeSlot?.state || 'none';
                          const displayHour = hour === 12 ? 12 : hour - 12;

                          return (
                            <TouchableOpacity
                              key={hour}
                              style={[
                                styles.timeFullSlot,
                                state === 'once' && styles.timeSlotOnce,
                                state === 'recurring' && styles.timeSlotRecurring,
                              ]}
                              onPress={() => {
                                const dayTimes = selectedTimes[day] || [];
                                const existingIndex = dayTimes.findIndex(t => t.hour === hour);

                                if (existingIndex >= 0) {
                                  const currentState = dayTimes[existingIndex].state;
                                  if (currentState === 'once') {
                                    // Change to recurring
                                    const updated = [...dayTimes];
                                    updated[existingIndex] = { hour, state: 'recurring' };
                                    setSelectedTimes({ ...selectedTimes, [day]: updated });
                                  } else {
                                    // Remove (recurring -> none)
                                    setSelectedTimes({
                                      ...selectedTimes,
                                      [day]: dayTimes.filter(t => t.hour !== hour),
                                    });
                                  }
                                } else {
                                  // Add as once
                                  setSelectedTimes({
                                    ...selectedTimes,
                                    [day]: [...dayTimes, { hour, state: 'once' }].sort((a, b) => a.hour - b.hour),
                                  });
                                }
                              }}
                            >
                              <View style={styles.timeSlotContent}>
                                <Text style={[
                                  styles.timeFullSlotText,
                                  state !== 'none' && styles.timeSlotTextSelected,
                                ]}>
                                  {hour === 12
                                    ? `오후 12:00 - 01:00`
                                    : hour === 23
                                    ? `오후 ${displayHour.toString().padStart(2, '0')}:00 - 12:00`
                                    : `오후 ${displayHour.toString().padStart(2, '0')}:00 - ${(displayHour + 1).toString().padStart(2, '0')}:00`}
                                </Text>
                                <View style={styles.timeSlotStateOptions}>
                                  <View style={[
                                    styles.stateOptionBadge,
                                    state === 'once' && styles.stateOptionActive
                                  ]}>
                                    <Text style={[
                                      styles.stateOptionText,
                                      state === 'once' && styles.stateOptionTextActive
                                    ]}>일회</Text>
                                  </View>
                                  <View style={[
                                    styles.stateOptionBadge,
                                    state === 'recurring' && styles.stateOptionActiveRecurring
                                  ]}>
                                    <Ionicons
                                      name="repeat"
                                      size={14}
                                      color={state === 'recurring' ? 'white' : 'rgba(255,255,255,0.3)'}
                                    />
                                    <Text style={[
                                      styles.stateOptionText,
                                      state === 'recurring' && styles.stateOptionTextActive
                                    ]}>반복</Text>
                                  </View>
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.scheduleBottomBar}>
          <TouchableOpacity
            style={[
              styles.scheduleSubmitButton,
              Object.keys(selectedTimes).some(day => selectedTimes[day]?.length > 0)
                ? styles.scheduleSubmitButtonActive
                : styles.scheduleSubmitButtonDisabled,
            ]}
            onPress={() => {
              if (Object.keys(selectedTimes).some(day => selectedTimes[day]?.length > 0)) {
                if (showScheduleEdit) {
                  // Save the updated schedule
                  setSavedSchedule(selectedTimes);
                  // Close the edit view
                  setShowScheduleEdit(false);
                  setExpandedDay(null);
                } else {
                  // Save initial schedule and update status
                  setSavedSchedule(selectedTimes);
                  setScheduleStatus('READY');
                  setExpandedDay(null);
                }
              }
            }}
            disabled={!Object.keys(selectedTimes).some(day => selectedTimes[day]?.length > 0)}
          >
            <Text style={styles.scheduleSubmitButtonText}>
              {showScheduleEdit ? '수정 요청 완료' : '일정 등록 완료'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Default home screen for trainers or members with assigned trainer
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.welcomeText}>안녕하세요, {name}님!</Text>
        {accountType === 'MEMBER' && trainerAccountId && (
          <TouchableOpacity
            style={styles.trainerBadge}
            onPress={() => router.push('/trainer-profile')}
          >
            <Text style={styles.trainerBadgeText}>담당 트레이너</Text>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Show welcome or other content when schedule is ready */}
        {accountType === 'MEMBER' && trainerAccountId && scheduleStatus === 'READY' && (
          <View style={styles.readyStateContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#5B99F7" />
            <Text style={styles.readyStateTitle}>일정 등록 완료</Text>
            <Text style={styles.readyStateSubtitle}>트레이너가 확인 중입니다</Text>

            {/* Display saved schedule summary */}
            {Object.keys(savedSchedule).length > 0 && (
              <View style={styles.schedulePreview}>
                <Text style={styles.schedulePreviewTitle}>등록된 일정</Text>
                {Object.entries(savedSchedule).map(([day, times]) => (
                  <View key={day} style={styles.schedulePreviewDay}>
                    <Text style={styles.schedulePreviewDayName}>{day}요일</Text>
                    <Text style={styles.schedulePreviewTimes}>
                      {times.length}개 시간대
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.readyStateActions}>
              <TouchableOpacity
                style={styles.modifyScheduleButton}
                onPress={() => {
                  // Load saved schedule for editing
                  setSelectedTimes(savedSchedule);
                  setShowScheduleEdit(true);
                }}
              >
                <Ionicons name="create-outline" size={20} color="white" />
                <Text style={styles.modifyScheduleButtonText}>일정 수정 요청</Text>
              </TouchableOpacity>
            </View>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  trainerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  trainerBadgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginRight: 4,
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
  scheduleRegistration: {
    padding: 20,
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  daysContainer: {
    marginBottom: 20,
  },
  daySection: {
    marginBottom: 10,
  },
  dayButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dayButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'white',
  },
  dayButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  dayButtonTextActive: {
    fontWeight: '600',
  },
  timeSlots: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 10,
  },
  timeSlotsScroll: {
    maxHeight: 300,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  timeSlotSelected: {
    backgroundColor: '#5B99F7',
  },
  timeSlotText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  timeSlotTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  timeSlotOnce: {
    backgroundColor: 'rgba(91, 153, 247, 0.3)',
    borderWidth: 2,
    borderColor: '#5B99F7',
  },
  timeSlotRecurring: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  timeSlotContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  timeSlotStateOptions: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 12,
  },
  stateOptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stateOptionActive: {
    backgroundColor: '#5B99F7',
    borderColor: '#5B99F7',
    shadowColor: '#5B99F7',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  stateOptionActiveRecurring: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  stateOptionText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '600',
  },
  stateOptionTextActive: {
    color: 'white',
  },
  timeSlotIndicator: {
    backgroundColor: '#5B99F7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  timeSlotIndicatorRecurring: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeSlotIndicatorText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#5B99F7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  scheduleHeader: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
  },
  scheduleBackButton: {
    position: 'absolute',
    left: 20,
    top: 40,
    padding: 4,
    zIndex: 1,
  },
  schedulePageTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  scheduleSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  scheduleScrollView: {
    flex: 1,
  },
  daysFullContainer: {
    padding: 20,
  },
  dayFullSection: {
    marginBottom: 12,
  },
  dayFullButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  dayFullButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dayFullButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '500',
  },
  timeFullSlots: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
  },
  timeFullSlotsScroll: {
    maxHeight: 350,
  },
  timeFullSlot: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timeFullSlotSelected: {
    backgroundColor: '#5B99F7',
    borderColor: 'white',
  },
  timeFullSlotText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    textAlign: 'center',
  },
  timeFullSlotTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  scheduleBottomBar: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#3B82F6',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  scheduleSubmitButton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  scheduleSubmitButtonActive: {
    backgroundColor: '#5B99F7',
  },
  scheduleSubmitButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scheduleSubmitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  readyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  readyStateTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: 'white',
    marginTop: 20,
    marginBottom: 8,
  },
  readyStateSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  readyStateActions: {
    marginTop: 40,
    width: '100%',
    paddingHorizontal: 20,
  },
  modifyScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B99F7',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  modifyScheduleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  schedulePreview: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  schedulePreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  schedulePreviewDay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  schedulePreviewDayName: {
    fontSize: 14,
    color: 'white',
  },
  schedulePreviewTimes: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  timePeriodSection: {
    marginBottom: 20,
  },
  timePeriodLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    borderRadius: 6,
  },
  helpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpIndicator: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  helpIndicatorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  helpText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  timeSlotInnerContent: {
    flex: 1,
  },
  timeSlotStateIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stateIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  stateIndicatorActive: {
    backgroundColor: '#5B99F7',
    borderColor: '#5B99F7',
  },
  stateIndicatorActiveRecurring: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  stateIndicatorText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
  },
  stateIndicatorTextActive: {
    color: 'white',
  },
});
