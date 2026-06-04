import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/auth';

export default function RegisterScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    name: '', vehicleType: 'AUTO', vehicleNumber: '', vehicleModel: '',
    vehicleYear: '', licenceNumber: '', city: 'Bangalore', aadhaarNumber: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!form.name || !form.vehicleNumber || !form.licenceNumber) {
      return Alert.alert('Please fill all required fields');
    }
    setLoading(true);
    try {
      const { data } = await api.post('/drivers/register', { ...form, phone });
      await setAuth(data.data.accessToken, data.data.driver);
      router.replace('/auth/kyc');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const field = (label: string, key: keyof typeof form, opts?: any) => (
    <View className="mb-4">
      <Text className="text-sm text-gray-600 mb-1">{label}</Text>
      <TextInput
        value={form[key]} onChangeText={v => setForm({ ...form, [key]: v })}
        className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50"
        {...opts}
      />
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-gray-900 mb-6">Create Driver Account</Text>
      {field('Full Name *', 'name')}
      {field('Vehicle Number *', 'vehicleNumber', { autoCapitalize: 'characters' })}
      {field('Vehicle Model', 'vehicleModel', { placeholder: 'e.g. Maruti Swift' })}
      {field('Vehicle Year', 'vehicleYear', { keyboardType: 'number-pad' })}
      {field('Licence Number *', 'licenceNumber', { autoCapitalize: 'characters' })}
      {field('Aadhaar Number (last 4 will be stored)', 'aadhaarNumber', { keyboardType: 'number-pad', maxLength: 12 })}
      <View className="mb-4">
        <Text className="text-sm text-gray-600 mb-1">Vehicle Type</Text>
        <View className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
          <Picker selectedValue={form.vehicleType} onValueChange={v => setForm({ ...form, vehicleType: v })}>
            {['AUTO', 'CAB', 'EV_CAB', 'BIKE'].map(t => <Picker.Item key={t} label={t} value={t} />)}
          </Picker>
        </View>
      </View>
      <TouchableOpacity onPress={handleRegister} disabled={loading} className="bg-blue-600 rounded-xl py-4 items-center mt-4">
        <Text className="text-white font-semibold text-base">{loading ? 'Registering...' : 'Create Account'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
