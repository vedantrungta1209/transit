import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/auth';

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const refs = useRef<TextInput[]>([]);
  const { setAuth } = useAuthStore();

  async function handleVerify() {
    const code = otp.join('');
    if (code.length < 6) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/user/verify-otp', { phone, otp: code });
      await setAuth(data.data.accessToken, data.data.user);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Invalid OTP');
    } finally { setLoading(false); }
  }

  function handleChange(val: string, idx: number) {
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
    if (newOtp.join('').length === 6) setTimeout(() => handleVerify(), 100);
  }

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Enter OTP</Text>
      <Text className="text-gray-500 mb-8">Sent to +91{phone}</Text>
      <View className="flex-row gap-3 mb-8 justify-center">
        {otp.map((digit, i) => (
          <TextInput key={i} ref={r => { if (r) refs.current[i] = r; }} value={digit} onChangeText={v => handleChange(v, i)} keyboardType="number-pad" maxLength={1} className="w-12 h-12 border-2 rounded-xl text-center text-xl font-bold border-gray-300 focus:border-blue-600" />
        ))}
      </View>
      <TouchableOpacity onPress={handleVerify} disabled={loading} className="bg-blue-600 rounded-2xl py-4 items-center">
        <Text className="text-white font-bold text-base">{loading ? 'Verifying...' : 'Verify'}</Text>
      </TouchableOpacity>
    </View>
  );
}
