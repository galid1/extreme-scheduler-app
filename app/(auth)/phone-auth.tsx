import React, {useEffect, useState, useRef} from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {useAuthStore} from '@/src/store/useAuthStore';
import authService from '@/src/services/api/auth.service';
import * as Device from 'expo-device';

const { height } = Dimensions.get('window');

export default function PhoneAuthScreen() {
  const router = useRouter();
  const { setAuthToken, setTempTokenForSignUp, setPhoneNumber, setAccountData } = useAuthStore();

  const [localPhoneNumber, setLocalPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isPhoneSubmitted, setIsPhoneSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(180); // 3 minutes

  const verificationInputRef = useRef<TextInput>(null);

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

  // Auto-focus verification input when phone is submitted
  useEffect(() => {
    if (isPhoneSubmitted) {
      // Small delay to ensure the input is rendered
      const timer = setTimeout(() => {
        verificationInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPhoneSubmitted]);

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
      // Send phone number without hyphens
      await authService.sendSmsCode(localPhoneNumber, deviceId);
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
      // Send phone number without hyphens
      const response = await authService.signIn(localPhoneNumber, verificationCode);
      if (response.authToken) {
        // Login successful - save token (also updates API client automatically)
        setAuthToken(response.authToken);

        // Get current user data
        try {
          const userResponse = await authService.getCurrentUser(response.authToken);
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
      } else if (response.tempTokenForSignUp) {
        // User not found - need to sign up
        setPhoneNumber(localPhoneNumber);
        setTempTokenForSignUp(response.tempTokenForSignUp);
        router.replace('/(auth)/signup');
      } else {
        Alert.alert('오류', '예상치 못한 응답입니다.');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert('인증 실패', '인증번호가 올바르지 않습니다. 다시 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'white' }}
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
                <TouchableOpacity
                  onPress={() => {
                    if (isPhoneSubmitted) {
                      setIsPhoneSubmitted(false);
                      setVerificationCode('');
                      setRemainingTime(180);
                    }
                  }}
                  disabled={!isPhoneSubmitted}
                  activeOpacity={isPhoneSubmitted ? 0.7 : 1}
                >
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: isPhoneSubmitted ? '#E0E0E0' : '#3B82F6',
                      backgroundColor: isPhoneSubmitted ? '#F3F4F6' : 'white',
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
                    pointerEvents={isPhoneSubmitted ? 'none' : 'auto'}
                  />
                </TouchableOpacity>

            {isPhoneSubmitted && (
              <View style={{ marginTop: 16 }}>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    ref={verificationInputRef}
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
                <TouchableOpacity
                  onPress={() => {
                    setVerificationCode('');
                    setRemainingTime(180);
                    handleSendCode();
                  }}
                  style={{
                    marginTop: 12,
                    alignSelf: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                  }}
                  disabled={isLoading}
                >
                  <Text style={{
                    color: isLoading ? '#9CA3AF' : '#3B82F6',
                    fontSize: 14,
                    fontWeight: '600',
                    textDecorationLine: 'underline',
                  }}>
                    인증번호 재전송
                  </Text>
                </TouchableOpacity>
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
