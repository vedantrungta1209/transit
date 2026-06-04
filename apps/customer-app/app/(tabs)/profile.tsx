import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth';
import { disconnectSocket } from '../../src/lib/socket';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    disconnectSocket();
    router.replace('/auth/phone');
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 20 }}>
      <Text className="text-2xl font-bold text-gray-900 mt-8 mb-6">Profile</Text>
      <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
        <Text className="text-lg font-bold text-gray-900">{user?.name || 'Transit User'}</Text>
        <Text className="text-gray-500 text-sm">{user?.phone}</Text>
      </View>
      <TouchableOpacity onPress={handleLogout} className="bg-red-50 rounded-2xl p-4 items-center mt-auto">
        <Text className="text-red-600 font-semibold">Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
