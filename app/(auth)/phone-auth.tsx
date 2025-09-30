import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useConfigStore } from '@/src/store/useConfigStore';
import authService from '@/src/services/api/auth.service';
import * as Device from 'expo-device';
import MockModeToggle from "@/src/components/MockModeToggle";

const { height } = Dimensions.get('window');

export default function PhoneAuthScreen() {
  const router = useRouter();
  const { setToken, setPhoneNumber, setAccountData } = useAuthStore();
  const { mockMode, skipStates, setSkipState } = useConfigStore();

  const [localPhoneNumber, setLocalPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isPhoneSubmitted, setIsPhoneSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(180); // 3 minutes
  const [tempToken, setTempToken] = useState<string>('');

  // Phone number validation
  const isValidPhone = localPhoneNumber.match(/^010\d{8}$/);

  // Timer effect
  useEffect(() => {
    if (isPhoneSubmitted && remainingTime > 0) {
      const timer = setTimeout(() => {
        setRemainingTime(remainingTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPhoneSubmitted, remainingTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      setLocalPhoneNumber(cleaned);
    }
  };

  const handleSendCode = async () => {
    setIsLoading(true);
    try {
      const deviceId = Device.modelId || 'unknown-device';
      const formattedPhone = `${localPhoneNumber.slice(0, 3)}-${localPhoneNumber.slice(3, 7)}-${localPhoneNumber.slice(7)}`;

      await authService.sendSmsCode(formattedPhone, deviceId);
      setIsPhoneSubmitted(true);
      setRemainingTime(180);
    } catch (error) {
      console.error('SMS send error:', error);
      Alert.alert('오류', '인증번호 전송에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsLoading(true);
    try {
      const formattedPhone = `${localPhoneNumber.slice(0, 3)}-${localPhoneNumber.slice(3, 7)}-${localPhoneNumber.slice(7)}`;

      const response = await authService.signIn(formattedPhone, verificationCode);

      if (response.accessToken) {
        // Login successful - save token
        setToken(response.accessToken);

        // Get current user data
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
      if (error.response?.status === 404 || error.response?.data?.code === 'USER_NOT_FOUND') {
        // User not found - save phone number and temp token for signup
        setPhoneNumber(localPhoneNumber);
        if (error.response?.data?.tempTokenForSignUp) {
          setTempToken(error.response.data.tempTokenForSignUp);
        }
        router.replace('/(auth)/signup');
      } else {
        Alert.alert('오류', '인증에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setSkipState('phoneAuth', true);
    // Navigate to signup in mock mode
    router.replace('/(auth)/signup');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'white' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={{ flex: 1 }}>
            <MockModeToggle/>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              {/* Title at the top */}
              <View style={{ marginTop: 60, paddingHorizontal: 24 }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '800',
                  color: '#3B82F6',
                  textAlign: 'center'
                }}>
                  전화번호를 입력해주세요
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#666',
                    fontWeight: '600',
                  textAlign: 'center',
                  marginTop: 8
                }}>
                  본인 확인을 위한 인증번호를 전송합니다
                </Text>
              </View>

              {/* Input area below the text */}
              <View style={{
                marginTop: 40,
                paddingHorizontal: 24,
              }}>
                <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#3B82F6',
                backgroundColor: 'white',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 18,
                color: '#333',
                textAlign: 'center',
              }}
              placeholder="010-0000-0000"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              value={formatPhoneNumber(localPhoneNumber)}
              onChangeText={handlePhoneChange}
              editable={!isPhoneSubmitted}
              maxLength={13}
            />

            {isPhoneSubmitted && (
              <View style={{ marginTop: 16 }}>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: '#3B82F6',
                      backgroundColor: 'white',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      paddingRight: 80,
                      fontSize: 18,
                      color: '#333',
                      textAlign: 'center',
                    }}
                    placeholder="인증번호 6자리"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    maxLength={6}
                  />
                  <View style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: [{ translateY: -12 }],
                    backgroundColor: '#F3F4F6',
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: remainingTime < 30 ? '#EF4444' : '#3B82F6',
                    }}>
                      {formatTime(remainingTime)}
                    </Text>
                  </View>
                </View>
                {remainingTime === 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setRemainingTime(180);
                      handleSendCode();
                    }}
                    style={{ marginTop: 8, alignSelf: 'center' }}
                  >
                    <Text style={{ color: '#3B82F6', fontSize: 14 }}>재전송</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Bottom button - full width and attached to keyboard */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
          }}>
            {mockMode && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#F59E0B',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
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
            <TouchableOpacity
              style={{
                backgroundColor: (!isPhoneSubmitted && isValidPhone) || (isPhoneSubmitted && verificationCode.length === 6)
                  ? '#3B82F6'
                  : '#E0E0E0',
                paddingVertical: 20,
              }}
              onPress={isPhoneSubmitted ? handleVerifyCode : handleSendCode}
              disabled={
                (!isPhoneSubmitted && !isValidPhone) ||
                (isPhoneSubmitted && verificationCode.length !== 6) ||
                isLoading
              }
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
                  {isPhoneSubmitted ? '완료' : '확인'}
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
