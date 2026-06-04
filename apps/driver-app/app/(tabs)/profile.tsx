import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { disconnectSocket } from '../../src/lib/socket';

export default function ProfileScreen() {
  const { driver, logout } = useAuthStore();
  const { data } = useQuery({ queryKey: ['profile'], queryFn: () => api.get('/drivers/me').then(r => r.data.data) });

  async function handleLogout() {
    await logout();
    disconnectSocket();
    router.replace('/auth/phone');
  }

  const profile = data || driver;
  const kycColors: Record<string, string> = { VERIFIED: 'text-green-600', PENDING: 'text-yellow-600', REJECTED: 'text-red-600' };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 20 }}>
      <Text className="text-2xl font-bold text-gray-900 mt-8 mb-6">Profile</Text>
      <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
        <Text className="text-lg font-bold text-gray-900 mb-1">{profile?.name}</Text>
        <Text className="text-gray-500 text-sm mb-1">{profile?.phone}</Text>
        <View className="flex-row items-center gap-2 mt-2">
          <Text className="text-sm text-gray-500">KYC:</Text>
          <Text className={`text-sm font-semibold ${kycColors[profile?.kycStatus] || ''}`}>{profile?.kycStatus}</Text>
        </View>
      </View>

      <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
        <Text className="text-sm font-semibold text-gray-700 mb-3">Vehicle Details</Text>
        <Text className="text-sm text-gray-600">{profile?.vehicleType} · {profile?.vehicleNumber}</Text>
        <Text className="text-sm text-gray-500 mt-1">{profile?.vehicleModel} {profile?.vehicleYear}</Text>
      </View>

      {profile?.kycStatus !== 'VERIFIED' && (
        <TouchableOpacity onPress={() => router.push('/auth/kyc')} className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
          <Text className="text-orange-700 font-semibold">Complete KYC →</Text>
          <Text className="text-orange-500 text-sm mt-1">Upload documents to start accepting rides</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={handleLogout} className="bg-red-50 rounded-2xl p-4 items-center">
        <Text className="text-red-600 font-semibold">Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
