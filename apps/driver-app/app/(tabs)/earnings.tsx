import { View, Text, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';

export default function EarningsScreen() {
  const { data } = useQuery({ queryKey: ['earnings'], queryFn: () => api.get('/drivers/me/earnings').then(r => r.data.data) });

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 20 }}>
      <Text className="text-2xl font-bold text-gray-900 mt-8 mb-6">Earnings</Text>
      <View className="flex-row gap-4 mb-6">
        {[['Today', data?.today], ['This Week', data?.thisWeek], ['This Month', data?.thisMonth]].map(([label, val]) => (
          <View key={label as string} className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-xs text-gray-500 mb-1">{label}</Text>
            <Text className="text-lg font-bold text-gray-900">₹{Number(val || 0).toLocaleString('en-IN')}</Text>
          </View>
        ))}
      </View>
      <Text className="text-sm font-medium text-gray-700 mb-3">Recent Rides</Text>
      {data?.rides?.map((ride: any) => (
        <View key={ride.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>{ride.dropAddress}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">{new Date(ride.createdAt).toLocaleDateString('en-IN')}</Text>
            </View>
            <Text className="text-base font-bold text-green-600">₹{ride.actualFare}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
