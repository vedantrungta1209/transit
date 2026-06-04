import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../src/lib/api';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    if (phone.length < 10) return Alert.alert('Enter a valid 10-digit number');
    setLoading(true);
    try {
      await api.post('/auth/user/send-otp', { phone });
      router.push({ pathname: '/auth/otp', params: { phone } });
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to send OTP');
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center">
        <Text className="text-4xl font-bold text-gray-900 mb-1">Transit</Text>
        <Text className="text-gray-500 mb-10">Your ride, your way</Text>
        <View className="flex-row items-center border rounded-2xl px-4 py-4 mb-4 bg-gray-50">
          <Text className="text-gray-600 mr-2 text-base">+91</Text>
          <TextInput value={phone} onChangeText={setPhone} placeholder="Mobile number" keyboardType="phone-pad" maxLength={10} className="flex-1 text-base text-gray-900" />
        </View>
        <TouchableOpacity onPress={handleSendOtp} disabled={loading || phone.length < 10} className="bg-blue-600 rounded-2xl py-4 items-center disabled:opacity-50">
          <Text className="text-white font-bold text-base">{loading ? 'Sending...' : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
