import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { useState } from 'react';

const statusColors: Record<string, string> = {
  COMPLETED: '#16a34a', CANCELLED: '#dc2626', IN_PROGRESS: '#0284c7',
};

export default function RidesScreen() {
  const { data } = useQuery({
    queryKey: ['ride-history'],
    queryFn: () => api.get('/rides/history').then(r => r.data.data),
  });

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 20 }}>
      <Text className="text-2xl font-bold text-gray-900 mt-8 mb-6">Your Rides</Text>
      {data?.data?.map((ride: any) => (
        <View key={ride.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-sm font-semibold text-gray-900 flex-1 mr-4" numberOfLines={1}>{ride.dropAddress}</Text>
            <Text className="text-sm font-bold" style={{ color: statusColors[ride.status] || '#6b7280' }}>
              {ride.status === 'COMPLETED' ? `₹${ride.actualFare}` : ride.status}
            </Text>
          </View>
          <Text className="text-xs text-gray-400">{new Date(ride.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-xs text-gray-500">{ride.vehicleType}</Text>
            <Text className="text-gray-200">·</Text>
            <Text className="text-xs text-gray-500">{ride.paymentMethod}</Text>
          </View>
        </View>
      ))}
      {!data?.data?.length && <Text className="text-center text-gray-400 mt-20">No rides yet</Text>}
    </ScrollView>
  );
}
