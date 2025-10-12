import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/src/store/useAuthStore';
import authService from '@/src/services/api/auth.service';
import { useConfigStore } from '@/src/store/useConfigStore';
import { MockDataManager } from '@/src/mock/mockDataManager';

const { height } = Dimensions.get('window');

type SignupStep = 'name' | 'birthDate' | 'accountType' | 'complete';

type AccountType = 'MEMBER' | 'TRAINER';

const STEP_TITLES: Record<SignupStep, string> = {
  name: '이름을 입력해주세요',
  birthDate: '생년월일을 입력해주세요',
  accountType: '계정 유형을 선택해주세요',
  complete: '가입이 완료되었습니다',
};

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  MEMBER: '회원',
  TRAINER: '트레이너',
};

export default function SignupScreen() {
  const router = useRouter();
  const { phoneNumber, setToken, setUserInfo, setAccountData, pushTokenInfo } = useAuthStore();
  const { mockMode, skipStates, setSkipState } = useConfigStore();
  const params = useLocalSearchParams<{ tempToken?: string }>();

  const [completedSteps, setCompletedSteps] = useState<SignupStep[]>([]);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [genderDigit, setGenderDigit] = useState('');
  const [accountType, setAccountType] = useState<AccountType | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  // Animation values for each step
  const nameAnim = useRef(new Animated.Value(0)).current;
  const birthDateAnim = useRef(new Animated.Value(0)).current;
  const accountTypeAnim = useRef(new Animated.Value(0)).current;

  const scrollViewRef = useRef<ScrollView>(null);
  const genderInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);

  const isValidName = name.length >= 2;

  // Validate birth date (YYMMDD format)
  const validateBirthDate = (dateStr: string): boolean => {
    if (dateStr.length !== 6) return false;

    const year = parseInt(dateStr.substring(0, 2));
    const month = parseInt(dateStr.substring(2, 4));
    const day = parseInt(dateStr.substring(4, 6));

    // Validate month (1-12)
    if (month < 1 || month > 12) return false;

    // Days in each month
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Check for leap year (for February)
    const fullYear = year > 50 ? 1900 + year : 2000 + year;
    const isLeapYear = (fullYear % 4 === 0 && fullYear % 100 !== 0) || (fullYear % 400 === 0);
    if (isLeapYear) daysInMonth[1] = 29;

    // Validate day
    if (day < 1 || day > daysInMonth[month - 1]) return false;

    return true;
  };

  const isValidBirthDate = birthDate.length === 6 && validateBirthDate(birthDate);
  const isValidGenderDigit = genderDigit.match(/^[1-4]$/);

  const formatBirthDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned;
  };

  const getGenderFromDigit = (digit: string): 'MALE' | 'FEMALE' => {
    return digit === '1' || digit === '3' ? 'MALE' : 'FEMALE';
  };

  // Initialize name step animation on mount
  useEffect(() => {
    Animated.spring(nameAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  const handleNameNext = () => {
    if (!isValidName) return;

    setCompletedSteps([...completedSteps, 'name']);

    // Animate birth date field appearance
    Animated.spring(birthDateAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();

    // Scroll down smoothly
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleBirthDateNext = () => {
    if (!isValidBirthDate || !isValidGenderDigit) return;

    setCompletedSteps([...completedSteps, 'birthDate']);

    // Animate account type field appearance
    Animated.spring(accountTypeAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();

    // Scroll down smoothly
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSignup = async () => {
    if (!accountType) {
      Alert.alert('오류', '계정 유형을 선택해주세요');
      return;
    }

    setIsLoading(true);
    try {
      // Format birth date to YYYY-MM-DD
      const year = parseInt(birthDate.substring(0, 2));
      const fullYear = year > 50 ? 1900 + year : 2000 + year;
      const month = birthDate.substring(2, 4);
      const day = birthDate.substring(4, 6);
      const formattedBirthDate = `${fullYear}-${month}-${day}`;

      const formattedPhone = phoneNumber ? `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}` : '';

      const signupData = {
        tempTokenForSignUp: params.tempToken || 'temp-token-' + Date.now(),
        name,
        birthDate: formattedBirthDate,
        gender: getGenderFromDigit(genderDigit),
        phoneNumber: formattedPhone,
        accountType,
        pushTokenInfo: pushTokenInfo || undefined, // 스토어에서 가져온 푸시 토큰 사용
      };

      let response;

      if (mockMode) {
        // In mock mode, initialize mock data directly
        const role = accountType === 'TRAINER' ? 'trainer' : 'member';
        await MockDataManager.initializeAllStores(role);
        Alert.alert('성공', '회원가입이 완료되었습니다 (Mock Mode)');
        router.replace('/(tabs)');
        return;
      } else {
        response = await authService.signUp(signupData);
      }

      if (response && response.accessToken) {
        // Save token and user info
        setToken(response.accessToken);
        setUserInfo({
          name: response.name,
          accountType: response.accountType,
        });

        // Get full account data
        try {
          const userResponse = await authService.getCurrentUser(response.accessToken);
          setAccountData({
            account: userResponse.account,
            trainer: userResponse.trainer,
            member: userResponse.member,
          });
        } catch (error) {
          console.error('Failed to get user data:', error);
        }

        // Navigate to home
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('오류', error.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setSkipState('signup', true);
    // In mock mode, choose a role and initialize
    Alert.alert(
      'Mock 모드',
      '계정 유형을 선택하세요',
      [
        {
          text: '트레이너',
          onPress: async () => {
            await MockDataManager.initializeAllStores('trainer');
            router.replace('/(tabs)');
          }
        },
        {
          text: '회원',
          onPress: async () => {
            await MockDataManager.initializeAllStores('member');
            router.replace('/(tabs)');
          }
        },
        {
          text: '취소',
          style: 'cancel'
        }
      ]
    );
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'white' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {/* Title at the top */}
          <View style={{ marginTop: 40, paddingHorizontal: 24, marginBottom: 20 }}>
            <Text style={{
              fontSize: 26,
              fontWeight: '700',
              color: '#3B82F6',
              textAlign: 'center'
            }}>
              회원가입
            </Text>
          </View>

          {/* Scrollable content area */}
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 20,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Name Step */}
            <Animated.View
              style={{
                opacity: nameAnim,
                transform: [{
                  translateY: nameAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                }, {
                  scale: nameAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                }],
                marginBottom: 20,
              }}
            >
              <Text style={{
                fontSize: 16,
                color: '#333',
                marginBottom: 12,
                fontWeight: '600'
              }}>
                이름을 입력해주세요
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  ref={nameInputRef}
                  style={{
                    borderWidth: 1,
                    borderColor: completedSteps.includes('name') ? '#E0E0E0' : '#3B82F6',
                    backgroundColor: completedSteps.includes('name') ? '#F3F4F6' : 'white',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    fontSize: 18,
                    color: '#333',
                    textAlign: 'center',
                  }}
                  placeholder="홍길동"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  editable={!completedSteps.includes('name')}
                  autoFocus
                />
              </View>
            </Animated.View>

            {/* Birth Date Step */}
            {completedSteps.includes('name') && (
              <Animated.View
                style={{
                  opacity: birthDateAnim,
                  transform: [{
                    translateY: birthDateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  }, {
                    scale: birthDateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  }],
                  marginBottom: 20,
                }}
              >
                <Text style={{
                  fontSize: 16,
                  color: '#333',
                  marginBottom: 12,
                  fontWeight: '600'
                }}>
                  생년월일을 입력해주세요
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: completedSteps.includes('birthDate') ? '#E0E0E0' : '#3B82F6',
                      backgroundColor: completedSteps.includes('birthDate') ? '#F3F4F6' : 'white',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      fontSize: 18,
                      color: '#333',
                      textAlign: 'center',
                      marginRight: 8,
                    }}
                    placeholder="990101"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    value={formatBirthDate(birthDate)}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/\D/g, '');
                      if (cleaned.length <= 6) {
                        setBirthDate(cleaned);
                        if (cleaned.length === 6) {
                          genderInputRef.current?.focus();
                        }
                      }
                    }}
                    maxLength={6}
                    editable={!completedSteps.includes('birthDate')}
                    autoFocus={!completedSteps.includes('birthDate')}
                  />
                  <Text style={{ color: '#333', fontSize: 18, marginHorizontal: 8 }}>-</Text>
                  <TextInput
                    ref={genderInputRef}
                    style={{
                      width: 50,
                      borderWidth: 1,
                      borderColor: completedSteps.includes('birthDate') ? '#E0E0E0' : '#3B82F6',
                      backgroundColor: completedSteps.includes('birthDate') ? '#F3F4F6' : 'white',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      fontSize: 18,
                      color: '#333',
                      textAlign: 'center',
                    }}
                    placeholder="1"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    value={genderDigit}
                    onChangeText={(text) => {
                      if (text.match(/^[1-4]?$/)) setGenderDigit(text);
                    }}
                    maxLength={1}
                    editable={!completedSteps.includes('birthDate')}
                  />
                  <Text style={{ color: '#999', fontSize: 18, marginLeft: 8 }}>******</Text>
                </View>
                <Text style={{
                  color: '#666',
                  fontSize: 12,
                  marginTop: 8,
                  textAlign: 'center'
                }}>
                  주민등록번호 앞 6자리와 뒤 첫 번째 숫자만 입력해주세요
                </Text>
                {birthDate.length === 6 && !validateBirthDate(birthDate) && (
                  <Text style={{
                    color: '#EF4444',
                    fontSize: 12,
                    marginTop: 4,
                    textAlign: 'center',
                    fontWeight: '600'
                  }}>
                    올바른 날짜를 입력해주세요 (예: 990229는 불가능)
                  </Text>
                )}
              </Animated.View>
            )}

            {/* Account Type Step */}
            {completedSteps.includes('birthDate') && (
              <Animated.View
                style={{
                  opacity: accountTypeAnim,
                  transform: [{
                    translateY: accountTypeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  }, {
                    scale: accountTypeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  }],
                  marginBottom: 20,
                }}
              >
                <Text style={{
                  fontSize: 16,
                  color: '#333',
                  marginBottom: 12,
                  fontWeight: '600'
                }}>
                  계정 유형을 선택해주세요
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {(['MEMBER', 'TRAINER'] as AccountType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={{
                        flex: 1,
                        backgroundColor: accountType === type ? '#3B82F6' : '#F3F4F6',
                        borderRadius: 12,
                        padding: 20,
                        marginHorizontal: type === 'MEMBER' ? 0 : 5,
                        marginRight: type === 'MEMBER' ? 5 : 0,
                        borderWidth: 1,
                        borderColor: accountType === type ? '#3B82F6' : '#E0E0E0',
                      }}
                      onPress={() => setAccountType(type)}
                    >
                      <Text style={{
                        color: accountType === type ? 'white' : '#333',
                        fontSize: 18,
                        textAlign: 'center',
                        fontWeight: accountType === type ? '700' : '500',
                      }}>
                        {ACCOUNT_TYPE_LABELS[type]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            )}
          </ScrollView>

          {/* Fixed bottom button area */}
          <View style={{
            paddingHorizontal: 24,
            paddingBottom: 20,
            paddingTop: 10,
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6'
          }}>
            {mockMode && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#F59E0B',
                  borderRadius: 12,
                  paddingVertical: 10,
                  marginBottom: 10,
                }}
                onPress={handleSkip}
              >
                <Text style={{
                  color: 'white',
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: '700',
                }}>
                  Skip (Mock Mode)
                </Text>
              </TouchableOpacity>
            )}
            {/* Name Step Button */}
            {!completedSteps.includes('name') && (
              <TouchableOpacity
                style={{
                  backgroundColor: isValidName ? '#3B82F6' : '#E0E0E0',
                  borderRadius: 12,
                  paddingVertical: 14,
                }}
                onPress={handleNameNext}
                disabled={!isValidName}
              >
                <Text style={{
                  color: 'white',
                  textAlign: 'center',
                  fontSize: 16,
                  fontWeight: '700',
                }}>
                  다음
                </Text>
              </TouchableOpacity>
            )}

            {/* Birth Date Step Button */}
            {completedSteps.includes('name') && !completedSteps.includes('birthDate') && (
              <TouchableOpacity
                style={{
                  backgroundColor: (isValidBirthDate && isValidGenderDigit) ? '#3B82F6' : '#E0E0E0',
                  borderRadius: 12,
                  paddingVertical: 14,
                }}
                onPress={handleBirthDateNext}
                disabled={!(isValidBirthDate && isValidGenderDigit)}
              >
                <Text style={{
                  color: 'white',
                  textAlign: 'center',
                  fontSize: 16,
                  fontWeight: '700',
                }}>
                  다음
                </Text>
              </TouchableOpacity>
            )}

            {/* Account Type Step Button */}
            {completedSteps.includes('birthDate') && (
              <TouchableOpacity
                style={{
                  backgroundColor: accountType !== '' ? '#3B82F6' : '#E0E0E0',
                  borderRadius: 12,
                  paddingVertical: 16,
                }}
                onPress={handleSignup}
                disabled={accountType === '' || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{
                    color: 'white',
                    textAlign: 'center',
                    fontSize: 18,
                    fontWeight: '700',
                  }}>
                    가입 완료
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}