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
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/useAuthStore';

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
  const { phoneNumber, setToken, setUserInfo } = useAuthStore();

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
  const isValidBirthDate = birthDate.length === 6;
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

      const signupData = {
        name,
        birthDate: formattedBirthDate,
        gender: getGenderFromDigit(genderDigit),
        phoneNumber: phoneNumber || '',
        accountType,
      };

      console.log('Signup data:', signupData);

      // TODO: Implement actual signup API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Save user info to store
      setUserInfo({
        name,
        accountType,
      });

      // Simulate successful signup
      setToken('dummy_token_with_signup');
      router.replace('/(tabs)');
    } catch {
      Alert.alert('오류', '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#3B82F6' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            {/* Title at the top */}
            <View style={{ marginTop: 40, paddingHorizontal: 24, marginBottom: 20 }}>
              <Text style={{
                fontSize: 26,
                fontWeight: '600',
                color: 'white',
                textAlign: 'center'
              }}>
                회원가입
              </Text>
            </View>

            {/* Input area */}
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingBottom: 100,
              }}
              showsVerticalScrollIndicator={false}
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
                  color: 'rgba(255,255,255,0.9)',
                  marginBottom: 12,
                  fontWeight: '500'
                }}>
                  이름을 입력해주세요
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    ref={nameInputRef}
                    style={{
                      borderWidth: completedSteps.includes('name') ? 0 : 1,
                      borderColor: 'white',
                      backgroundColor: completedSteps.includes('name') ? 'rgba(255,255,255,0.1)' : '#3B82F6',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      fontSize: 18,
                      color: 'white',
                      textAlign: 'center',
                    }}
                    placeholder="홍길동"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={name}
                    onChangeText={setName}
                    editable={!completedSteps.includes('name')}
                    autoFocus
                  />
                  {completedSteps.includes('name') && (
                    <View style={{
                      position: 'absolute',
                      right: 16,
                      top: 16,
                    }}>
                      <Text style={{ fontSize: 20 }}>✓</Text>
                    </View>
                  )}
                </View>
                {!completedSteps.includes('name') && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: isValidName ? '#5B99F7' : '#E0E0E0',
                      borderRadius: 12,
                      paddingVertical: 14,
                      marginTop: 12,
                    }}
                    onPress={handleNameNext}
                    disabled={!isValidName}
                  >
                    <Text style={{
                      color: 'white',
                      textAlign: 'center',
                      fontSize: 16,
                      fontWeight: '600',
                    }}>
                      다음
                    </Text>
                  </TouchableOpacity>
                )}
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
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: 12,
                    fontWeight: '500'
                  }}>
                    생년월일을 입력해주세요
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={{
                        flex: 1,
                        borderWidth: completedSteps.includes('birthDate') ? 0 : 1,
                        borderColor: 'white',
                        backgroundColor: completedSteps.includes('birthDate') ? 'rgba(255,255,255,0.1)' : '#3B82F6',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        fontSize: 18,
                        color: 'white',
                        textAlign: 'center',
                        marginRight: 8,
                      }}
                      placeholder="990101"
                      placeholderTextColor="rgba(255,255,255,0.6)"
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
                    <Text style={{ color: 'white', fontSize: 18, marginHorizontal: 8 }}>-</Text>
                    <TextInput
                      ref={genderInputRef}
                      style={{
                        width: 50,
                        borderWidth: completedSteps.includes('birthDate') ? 0 : 1,
                        borderColor: 'white',
                        backgroundColor: completedSteps.includes('birthDate') ? 'rgba(255,255,255,0.1)' : '#3B82F6',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        fontSize: 18,
                        color: 'white',
                        textAlign: 'center',
                      }}
                      placeholder="1"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      keyboardType="number-pad"
                      value={genderDigit}
                      onChangeText={(text) => {
                        if (text.match(/^[1-4]?$/)) setGenderDigit(text);
                      }}
                      maxLength={1}
                      editable={!completedSteps.includes('birthDate')}
                    />
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, marginLeft: 8 }}>******</Text>
                    {completedSteps.includes('birthDate') && (
                      <View style={{
                        position: 'absolute',
                        right: 100,
                        top: 16,
                      }}>
                        <Text style={{ fontSize: 20 }}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 12,
                    marginTop: 8,
                    textAlign: 'center'
                  }}>
                    주민등록번호 앞 6자리와 뒤 첫 번째 숫자만 입력해주세요
                  </Text>
                  {!completedSteps.includes('birthDate') && (
                    <TouchableOpacity
                      style={{
                        backgroundColor: (isValidBirthDate && isValidGenderDigit) ? '#5B99F7' : '#E0E0E0',
                        borderRadius: 12,
                        paddingVertical: 14,
                        marginTop: 12,
                      }}
                      onPress={handleBirthDateNext}
                      disabled={!(isValidBirthDate && isValidGenderDigit)}
                    >
                      <Text style={{
                        color: 'white',
                        textAlign: 'center',
                        fontSize: 16,
                        fontWeight: '600',
                      }}>
                        다음
                      </Text>
                    </TouchableOpacity>
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
                  }}
                >
                  <Text style={{
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: 12,
                    fontWeight: '500'
                  }}>
                    계정 유형을 선택해주세요
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {(['MEMBER', 'TRAINER'] as AccountType[]).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={{
                          flex: 1,
                          backgroundColor: accountType === type ? '#5B99F7' : 'rgba(255,255,255,0.1)',
                          borderRadius: 12,
                          padding: 20,
                          marginHorizontal: type === 'MEMBER' ? 0 : 5,
                          marginRight: type === 'MEMBER' ? 5 : 0,
                          borderWidth: 1,
                          borderColor: accountType === type ? 'white' : 'rgba(255,255,255,0.2)',
                        }}
                        onPress={() => setAccountType(type)}
                      >
                        <Text style={{
                          color: 'white',
                          fontSize: 18,
                          textAlign: 'center',
                          fontWeight: accountType === type ? '600' : '400',
                        }}>
                          {ACCOUNT_TYPE_LABELS[type]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: accountType !== '' ? '#5B99F7' : '#E0E0E0',
                      borderRadius: 12,
                      paddingVertical: 16,
                      marginTop: 20,
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
                        fontWeight: '600',
                      }}>
                        가입 완료
                      </Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}