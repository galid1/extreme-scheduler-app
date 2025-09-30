import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Image,
  AppState,
} from 'react-native';
import { useAuthStore } from '@/src/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { trainerScheduleService, trainerService, authService } from '@/src/services/api';
import type { RegisterScheduleRequest, DayOfWeek } from '@/src/types/api';
import { TrainerScheduleStatus } from '@/src/types/enums';
import { useAssignmentStore } from '@/src/store/useAssignmentStore';
import MockModeToggle from '@/src/components/MockModeToggle';
import { useConfigStore } from '@/src/store/useConfigStore';

type TimeSlotState = 'none' | 'once' | 'recurring';

interface TimeSlotSelection {
  hour: number;
  state: TimeSlotState;
}


export default function TrainerHome() {
  const router = useRouter();
  const { account, trainer, savedSchedule, setSavedSchedule, setAccountData } = useAuthStore();
  const name = account?.privacyInfo?.name;
  const status = trainer?.status
  const scheduleStatus = trainer?.scheduleStatus;
  const { assignmentRequests, setAssignmentRequests, setIsLoadingRequests } = useAssignmentStore();
  const appStateRef = useRef(AppState.currentState);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<{ [key: string]: TimeSlotSelection[] }>({});
  const [showScheduleEdit, setShowScheduleEdit] = useState(false);
  const [showScheduleDetail, setShowScheduleDetail] = useState(false);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { mockMode } = useConfigStore();

  // Load saved schedule on mount for editing
  useEffect(() => {
    if (savedSchedule && Object.keys(savedSchedule).length > 0 && showScheduleEdit) {
      setSelectedTimes(savedSchedule);
    }
  }, [showScheduleEdit]);

  // Update trainer status when app comes to foreground
  useEffect(() => {
    const fetchLatestUserData = async () => {
      if (account && !mockMode) {
        try {
          const userResponse = await authService.getCurrentUser();
          if (userResponse.trainer) {
            setAccountData({
              account: userResponse.account,
              member: userResponse.member,
              trainer: userResponse.trainer
            });
          }
        } catch (error) {
          console.error('Error fetching latest user data:', error);
        }
      }
    };

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        fetchLatestUserData();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [account]);

  // Fetch trainer assignment requests
  useEffect(() => {
    if (scheduleStatus === TrainerScheduleStatus.READY) {
      fetchAssignmentRequests();
    }
  }, [scheduleStatus]);



  const fetchAssignmentRequests = async () => {
    setIsLoadingRequests(true);
    try {
      if (mockMode) {
        // Mock data is already loaded by MockDataManager
        // No need to fetch anything in mock mode
      } else {
        const response = await trainerService.getAssignmentRequests();
        setAssignmentRequests(response.content);
      }
    } catch (error) {
      console.error('Error fetching assignment requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const userResponse = await authService.getCurrentUser();
      if (userResponse.trainer) {
        setAccountData({
          account: userResponse.account,
          member: userResponse.member,
          trainer: userResponse.trainer
        });
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      Alert.alert('오류', '상태 업데이트에 실패했습니다.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show pending approval screen for PENDING status
  if (status === 'PENDING') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pendingContainer}>
          <View style={styles.pendingCard}>
            <Ionicons name="time-outline" size={80} color="#3B82F6" />
            <Text style={styles.pendingTitle}>관리자 승인 대기중</Text>
            <Text style={styles.pendingMessage}>
              트레이너 계정이 승인 대기 중입니다.{' '}
              관리자의 승인 후 서비스를 이용하실 수 있습니다.
            </Text>
            <Text style={styles.pendingSubMessage}>
              승인까지 보통 1-2일 정도 소요됩니다.
            </Text>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={20} color="white" />
                  <Text style={styles.refreshButtonText}>새로고침</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.pendingInfoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
              <Text style={styles.pendingInfoText}>
                승인 상태는 자동으로 업데이트됩니다.
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show schedule registration as full page for NOT_READY status or when editing
  if (scheduleStatus === TrainerScheduleStatus.NOT_READY || showScheduleEdit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scheduleHeader}>
          {showScheduleEdit && (
            <TouchableOpacity
              style={styles.scheduleBackButton}
              onPress={() => {
                setShowScheduleEdit(false);
                // Restore saved schedule from store when cancelling edit
                setSelectedTimes(savedSchedule || {});
                setExpandedDay(null);
              }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          )}
          <Text style={styles.schedulePageTitle}>
            {showScheduleEdit
              ? '일정 수정'
              : '운영 가능한 일정을 등록하세요'}
          </Text>
          <Text style={styles.scheduleSubtitle}>
            회원들이 수업을 신청할 수 있는 시간대를 설정합니다
          </Text>
          <View style={styles.helpContainer}>
            <View style={styles.helpItem}>
              <View style={[styles.helpIndicator, { backgroundColor: 'rgba(139, 92, 246, 0.3)' }]}>
                <Ionicons name="repeat" size={12} color="white" />
                <Text style={styles.helpIndicatorText}>반복</Text>
              </View>
              <Text style={styles.helpText}>매주 반복</Text>
            </View>
            <View style={styles.helpItem}>
              <View style={[styles.helpIndicator, { backgroundColor: 'rgba(91, 153, 247, 0.3)' }]}>
                <Text style={styles.helpIndicatorText}>일회</Text>
              </View>
              <Text style={styles.helpText}>한 번만</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scheduleScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.daysContainer}>
            {(() => {
              const days = ['월', '화', '수', '목', '금', '토', '일'];
              // Sort days to put expanded day first
              const sortedDays = expandedDay
                ? [expandedDay, ...days.filter(d => d !== expandedDay)]
                : days;

              return sortedDays.map((day) => (
                <View key={day} style={styles.daySection}>
                  <TouchableOpacity
                    style={[
                      styles.dayButton,
                      expandedDay === day && styles.dayButtonActive,
                    ]}
                    onPress={() => setExpandedDay(expandedDay === day ? null : day)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      expandedDay === day && styles.dayButtonTextActive,
                    ]}>
                      {day}요일
                    </Text>
                    <View style={styles.dayButtonRight}>
                      {selectedTimes[day]?.length > 0 && (
                        <View style={styles.dayCountBadge}>
                          <Text style={styles.dayCountText}>
                            {selectedTimes[day].length}
                          </Text>
                        </View>
                      )}
                      <Ionicons
                        name={expandedDay === day ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="white"
                        style={{ marginLeft: 8 }}
                      />
                    </View>
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
                                  if (currentState === 'recurring') {
                                    // Change to once
                                    const updated = [...dayTimes];
                                    updated[existingIndex] = { hour, state: 'once' };
                                    setSelectedTimes({ ...selectedTimes, [day]: updated });
                                  } else {
                                    // Remove (once -> none)
                                    setSelectedTimes({
                                      ...selectedTimes,
                                      [day]: dayTimes.filter(t => t.hour !== hour),
                                    });
                                  }
                                } else {
                                  // Add as recurring
                                  setSelectedTimes({
                                    ...selectedTimes,
                                    [day]: [...dayTimes, { hour, state: 'recurring' }].sort((a, b) => a.hour - b.hour),
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
                                    state === 'recurring' && styles.stateOptionActiveRecurring
                                  ]}>
                                    <Ionicons
                                      name="repeat"
                                      size={14}
                                      color={state === 'recurring' ? 'white' : '#cbd5e1'}
                                    />
                                    <Text style={[
                                      styles.stateOptionText,
                                      state === 'recurring' && styles.stateOptionTextActive
                                    ]}>반복</Text>
                                  </View>
                                  <View style={[
                                    styles.stateOptionBadge,
                                    state === 'once' && styles.stateOptionActive
                                  ]}>
                                    <Text style={[
                                      styles.stateOptionText,
                                      state === 'once' && styles.stateOptionTextActive
                                    ]}>일회</Text>
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
                                  if (currentState === 'recurring') {
                                    // Change to once
                                    const updated = [...dayTimes];
                                    updated[existingIndex] = { hour, state: 'once' };
                                    setSelectedTimes({ ...selectedTimes, [day]: updated });
                                  } else {
                                    // Remove (once -> none)
                                    setSelectedTimes({
                                      ...selectedTimes,
                                      [day]: dayTimes.filter(t => t.hour !== hour),
                                    });
                                  }
                                } else {
                                  // Add as recurring
                                  setSelectedTimes({
                                    ...selectedTimes,
                                    [day]: [...dayTimes, { hour, state: 'recurring' }].sort((a, b) => a.hour - b.hour),
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
                                    state === 'recurring' && styles.stateOptionActiveRecurring
                                  ]}>
                                    <Ionicons
                                      name="repeat"
                                      size={14}
                                      color={state === 'recurring' ? 'white' : '#cbd5e1'}
                                    />
                                    <Text style={[
                                      styles.stateOptionText,
                                      state === 'recurring' && styles.stateOptionTextActive
                                    ]}>반복</Text>
                                  </View>
                                  <View style={[
                                    styles.stateOptionBadge,
                                    state === 'once' && styles.stateOptionActive
                                  ]}>
                                    <Text style={[
                                      styles.stateOptionText,
                                      state === 'once' && styles.stateOptionTextActive
                                    ]}>일회</Text>
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
              ));
            })()}
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
            onPress={async () => {
              if (Object.keys(selectedTimes).some(day => selectedTimes[day]?.length > 0)) {
                // If a day is expanded, collapse it first
                if (expandedDay) {
                  setExpandedDay(null);
                } else {
                  // Convert day names to DayOfWeek enum
                  const dayMapping: { [key: string]: DayOfWeek } = {
                    '월': 'MONDAY',
                    '화': 'TUESDAY',
                    '수': 'WEDNESDAY',
                    '목': 'THURSDAY',
                    '금': 'FRIDAY',
                    '토': 'SATURDAY',
                    '일': 'SUNDAY',
                  };

                  try {
                    setIsSubmittingSchedule(true);

                    // Prepare schedule data for API
                    const request: RegisterScheduleRequest = {
                      periodicScheduleLines: [],
                      onetimeScheduleLines: []
                    };

                    // Get current date for one-time schedules
                    const today = new Date();
                    const getNextDate = (dayOfWeek: string) => {
                      const targetDay = ['일', '월', '화', '수', '목', '금', '토'].indexOf(dayOfWeek);
                      const currentDay = today.getDay();
                      const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7; // If same day, schedule for next week
                      const nextDate = new Date(today);
                      nextDate.setDate(today.getDate() + daysUntilTarget);
                      return nextDate.toISOString().split('T')[0];
                    };

                    // Process selected times
                    Object.entries(selectedTimes).forEach(([day, slots]) => {
                      if (slots && slots.length > 0) {
                        slots.forEach(slot => {
                          if (slot.state === 'recurring') {
                            // Periodic schedule
                            request.periodicScheduleLines?.push({
                              dayOfWeek: dayMapping[day],
                              startHour: slot.hour,
                              endHour: slot.hour + 1, // Assuming 1-hour slots
                            });
                          } else if (slot.state === 'once') {
                            // One-time schedule
                            request.onetimeScheduleLines?.push({
                              scheduleDate: getNextDate(day),
                              startHour: slot.hour,
                              endHour: slot.hour + 1, // Assuming 1-hour slots
                            });
                          }
                        });
                      }
                    });

                    // Check mock mode
                    if (!mockMode) {
                      // Register trainer schedule only in non-mock mode
                      await trainerScheduleService.registerSchedule(request);

                      // Fetch updated user data after schedule registration
                      const userResponse = await authService.getCurrentUser();
                      if (userResponse.trainer) {
                        setAccountData({
                          account: userResponse.account,
                          member: userResponse.member,
                          trainer: userResponse.trainer
                        });
                      }
                    }

                    // Save to local store
                    setSavedSchedule(selectedTimes);

                    if (showScheduleEdit) {
                      setShowScheduleEdit(false);
                      Alert.alert('성공', '일정 수정이 완료되었습니다.');
                    } else {
                      Alert.alert('성공', '일정 등록이 완료되었습니다.');
                    }
                  } catch (error: any) {
                    console.error('Schedule registration error:', error);
                    Alert.alert(
                      '등록 실패',
                      error.message || '일정 등록에 실패했습니다. 다시 시도해주세요.'
                    );
                  } finally {
                    setIsSubmittingSchedule(false);
                  }
                }
              }
            }}
            disabled={!Object.keys(selectedTimes).some(day => selectedTimes[day]?.length > 0) || isSubmittingSchedule}
          >
            {isSubmittingSchedule ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.scheduleSubmitButtonText}>
                {expandedDay
                  ? '완료'
                  : showScheduleEdit
                    ? '수정 요청 완료'
                    : '일정 등록 완료'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show schedule detail view when requested
  if (showScheduleDetail) {
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: 'white' }]}>
        <View style={styles.scheduleDetailHeader}>
          <TouchableOpacity
            style={styles.scheduleDetailBackButton}
            onPress={() => setShowScheduleDetail(false)}
          >
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.scheduleDetailTitle}>등록된 일정</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.scheduleCalendarContainer}>
          {/* Days header */}
          <View style={styles.calendarHeader}>
            <View style={styles.timeColumnHeader} />
            {days.map((day) => (
              <View key={day} style={styles.dayColumnHeader}>
                <Text style={styles.dayColumnText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Time grid */}
          <ScrollView style={styles.calendarBody} showsVerticalScrollIndicator={false}>
            {hours.map((hour) => {
              const isPM = hour >= 12;
              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
              const period = isPM ? '오후🌙' : '오전☀️';

              return (
                <View key={hour} style={[styles.timeRow, isPM && styles.timeRowPM]}>
                  <View style={[styles.timeLabel, isPM && styles.timeLabelPM]}>
                    <Text style={styles.timeLabelPeriod}>{period}</Text>
                    <Text style={styles.timeLabelText}>
                      {displayHour}시
                    </Text>
                  </View>
                  {days.map((day) => {
                    const timeSlot = savedSchedule[day]?.find(t => t.hour === hour);
                    const state = timeSlot?.state || 'none';

                    return (
                      <View
                        key={`${day}-${hour}`}
                        style={[
                          styles.timeCell,
                          isPM && styles.timeCellPM,
                          state === 'once' && styles.timeCellOnce,
                          state === 'recurring' && styles.timeCellRecurring,
                        ]}
                      >
                        {state === 'recurring' && (
                          <View style={styles.timeCellIndicator}>
                            <Ionicons name="repeat" size={12} color="white" />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Legend */}
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#3B82F6', borderWidth: 1, borderColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>일회</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#8B5CF6', borderWidth: 1, borderColor: '#8B5CF6' }]} />
            <Text style={styles.legendText}>매주 반복</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  console.log("HERERE @@@@@@@@@@@", scheduleStatus)
  // Default home screen for trainers or members with assigned trainer
  return (
    <SafeAreaView style={styles.container}>
      <MockModeToggle />
      <View style={styles.topHeader}>
        <Text style={styles.welcomeText}>안녕하세요, {name}님!</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Show trainer dashboard or schedule management */}
        {(scheduleStatus === TrainerScheduleStatus.READY) && (
          <>
            <View style={styles.trainerDashboard}>
              <Text style={styles.dashboardTitle}>담당 회원 대시보드</Text>
              <View style={styles.statsContainer}>
                <TouchableOpacity
                  style={styles.statCard}
                  onPress={() => router.push('/approved-members')}
                >
                  <Text style={styles.statNumber}>12</Text>
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
        )}
      </ScrollView>

      {/* Auto Scheduling Button for Trainers with READY status */}
      {scheduleStatus === TrainerScheduleStatus.READY && (
        <View style={styles.autoScheduleButtonContainer}>
          <TouchableOpacity
            style={styles.autoScheduleButton}
            onPress={() => router.push('/auto-scheduling')}
          >
            <Ionicons name="calendar-outline" size={20} color="white" />
            <Text style={styles.autoScheduleButtonText}>자동 스케줄링</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* View Schedule Button for Trainers with SCHEDULED status */}
      {trainer.scheduleStatus === TrainerScheduleStatus.SCHEEULDED && (
        <View style={styles.autoScheduleButtonContainer}>
          <TouchableOpacity
            style={styles.viewScheduleButton}
            onPress={() => router.push('/training-schedule')}
          >
            <Ionicons name="calendar-sharp" size={20} color="white" />
            <Text style={styles.autoScheduleButtonText}>트레이닝 일정 확인</Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 30,
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#333',
      fontWeight: '700',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  inputSection: {
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginTop: 12,
  },
  phoneIcon: {
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    color: '#1F2937',
    paddingVertical: 12,
  },
  searchingIndicator: {
    marginLeft: 12,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#333',
    marginTop: 10,
    fontSize: 14,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#1F2937',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  gymBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  gymText: {
    fontSize: 13,
    color: '#6B7280',
  },
  profileExperience: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#333',
    marginLeft: 4,
    fontSize: 14,
  },
  specialtiesContainer: {
    marginBottom: 20,
  },
  specialtiesTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyTag: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  specialtyText: {
    color: '#3B82F6',
    fontSize: 12,
  },
  assignButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  assignButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  assignButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
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
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#999',
  },
  trainerBadgeText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  trainerScheduleContainer: {
    padding: 20,
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
    marginBottom: 16,
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
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dayButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3B82F6',
  },
  dayButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    fontWeight: '700',
    color: '#3B82F6',
  },
  dayButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayCountBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  dayCountText: {
    color: 'white',
    fontSize: 12,
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
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#e9ecef',
  },
  stateOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
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
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  stateOptionTextActive: {
    color: 'white',
    fontWeight: '700',
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
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  scheduleSubtitle: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#f8f9fa',
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
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  timeFullSlotSelected: {
    backgroundColor: '#5B99F7',
    borderColor: 'white',
  },
  timeFullSlotText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeFullSlotTextSelected: {
    color: 'white',
    fontWeight: '700',
  },
  scheduleBottomBar: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  scheduleSubmitButton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  scheduleSubmitButtonActive: {
    backgroundColor: '#3B82F6',
  },
  scheduleSubmitButtonDisabled: {
    backgroundColor: '#E0E0E0',
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
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  readyStateSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  readyStateActions: {
    marginTop: 40,
    width: '100%',
    paddingHorizontal: 20,
  },
  scheduleButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modifyScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  modifyScheduleButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  unreadyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  unreadyButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  schedulePreview: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  schedulePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  schedulePreviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  schedulePreviewDay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E7FF',
  },
  schedulePreviewDayName: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
  },
  schedulePreviewTimes: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  timePeriodSection: {
    marginBottom: 20,
  },
  timePeriodLabel: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#e9ecef',
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
    color: '#666',
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
  // Schedule detail view styles
  scheduleDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  scheduleDetailBackButton: {
    padding: 4,
  },
  scheduleDetailTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  scheduleCalendarContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 8,
  },
  timeColumnHeader: {
    width: 60,
  },
  dayColumnHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayColumnText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  dayColumnBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  dayColumnBadgeText: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '600',
  },
  calendarBody: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  timeRowPM: {
    backgroundColor: '#F0F7FF',
  },
  timeLabel: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 8,
  },
  timeLabelPM: {
    backgroundColor: '#E8F2FF',
  },
  timeLabelPeriod: {
    color: '#666',
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
  },
  timeLabelText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },
  timeCell: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#F3F4F6',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeCellPM: {
    backgroundColor: '#F8FBFF',
  },
  timeCellOnce: {
    backgroundColor: '#3B82F6',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  timeCellRecurring: {
    backgroundColor: '#8B5CF6',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  timeCellIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F8FAFC',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    color: '#6B7280',
    fontSize: 12,
  },
  memberRequestsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  memberRequestsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  memberRequestCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  memberRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberRequestName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  memberRequestBadge: {
    backgroundColor: 'rgba(91, 153, 247, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#5B99F7',
  },
  memberRequestBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  memberRequestSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  memberRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  memberRequestAccept: {
    flex: 1,
    backgroundColor: '#5B99F7',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  memberRequestAcceptText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  memberRequestReject: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  memberRequestRejectText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  autoScheduleButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  autoScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 14,
    paddingVertical: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  autoScheduleButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  scheduledStateContainer: {
    padding: 20,
    gap: 16,
  },
  scheduledStateCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduledStateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  scheduledStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  scheduledStateMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    marginBottom: 8,
  },
  scheduledStateSubMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 16,
  },
  scheduledStateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  scheduledStateInfoText: {
    fontSize: 13,
    color: '#6B7280',
  },
  contactTrainerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  contactTrainerButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  viewScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  trainingScheduleInfo: {
    marginTop: 12,
  },
  trainingInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
      fontWeight: '600',
    gap: 8,
    marginBottom: 8,
  },
  trainingInfoText: {
    fontSize: 14,
    color: '#475569',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginVertical: 20,
    gap: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: {
    color: '#1E40AF',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pendingCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    maxWidth: 400,
    width: '100%',
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 12,
  },
  pendingMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  pendingSubMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    minWidth: 120,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  pendingInfoText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
