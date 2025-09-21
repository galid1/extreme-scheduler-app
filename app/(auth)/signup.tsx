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
  const { phoneNumber, setToken } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<SignupStep>('name');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [genderDigit, setGenderDigit] = useState('');
  const [accountType, setAccountType] = useState<AccountType | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const genderInputRef = useRef<TextInput>(null);

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

  const handleNextStep = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (currentStep === 'name' && isValidName) {
        setCurrentStep('birthDate');
      } else if (currentStep === 'birthDate' && isValidBirthDate && isValidGenderDigit) {
        setCurrentStep('accountType');
      }

      // Reset animations for next step
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
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

      // Simulate successful signup
      setToken('dummy_token_with_signup');
      router.replace('/(tabs)');
    } catch {
      Alert.alert('오류', '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'name':
        return (
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: 'white',
                backgroundColor: '#3B82F6',
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
              autoFocus
            />
          </Animated.View>
        );

      case 'birthDate':
        return (
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}>
            <View style={{ marginBottom: 20 }}>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
              }}>
                <Text style={{ color: 'white', fontSize: 16 }}>{name}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: 'white',
                  backgroundColor: '#3B82F6',
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
                    // Auto focus to gender input when birth date is complete
                    if (cleaned.length === 6) {
                      genderInputRef.current?.focus();
                    }
                  }
                }}
                maxLength={6}
                autoFocus
              />
              <Text style={{ color: 'white', fontSize: 18, marginHorizontal: 8 }}>-</Text>
              <TextInput
                ref={genderInputRef}
                style={{
                  width: 50,
                  borderWidth: 1,
                  borderColor: 'white',
                  backgroundColor: '#3B82F6',
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
              />
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, marginLeft: 8 }}>******</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
              주민등록번호 앞 6자리와 뒤 첫 번째 숫자만 입력해주세요
            </Text>
          </Animated.View>
        );

      case 'accountType':
        return (
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}>
            <View style={{ marginBottom: 20 }}>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
                marginBottom: 10,
              }}>
                <Text style={{ color: 'white', fontSize: 16 }}>{name}</Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
              }}>
                <Text style={{ color: 'white', fontSize: 16 }}>
                  {birthDate.substring(0, 2)}.{birthDate.substring(2, 4)}.{birthDate.substring(4, 6)}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {(['MEMBER', 'TRAINER'] as AccountType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={{
                    flex: 1,
                    backgroundColor: accountType === type ? '#5B99F7' : 'rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: 16,
                    marginHorizontal: type === 'MEMBER' ? 0 : 5,
                    marginRight: type === 'MEMBER' ? 5 : 0,
                    borderWidth: 1,
                    borderColor: accountType === type ? 'white' : 'rgba(255,255,255,0.2)',
                  }}
                  onPress={() => setAccountType(type)}
                >
                  <Text style={{
                    color: 'white',
                    fontSize: 16,
                    textAlign: 'center',
                    fontWeight: accountType === type ? '600' : '400',
                  }}>
                    {ACCOUNT_TYPE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'name':
        return isValidName;
      case 'birthDate':
        return isValidBirthDate && isValidGenderDigit;
      case 'accountType':
        return accountType !== '';
      default:
        return false;
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
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              {/* Title at the top */}
              <View style={{ marginTop: 60, paddingHorizontal: 24 }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '600',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  {STEP_TITLES[currentStep]}
                </Text>
              </View>

              {/* Input area */}
              <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingHorizontal: 24,
                  paddingTop: 60,
                }}
              >
                {renderStepContent()}
              </ScrollView>

              {/* Bottom button */}
              <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#3B82F6',
              }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: canProceed() ? '#5B99F7' : '#E0E0E0',
                    paddingVertical: 20,
                  }}
                  onPress={currentStep === 'accountType' ? handleSignup : handleNextStep}
                  disabled={!canProceed() || isLoading}
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
                      {currentStep === 'accountType' ? '가입 완료' : '다음'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}