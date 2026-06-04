import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useState } from 'react';

interface Props {
  pickup: { lat: number; lng: number; address: string };
  drop: { lat: number; lng: number; address: string };
  onBook: (vehicleType: string, paymentMethod: string) => void;
  onBack: () => void;
}

const VEHICLES = [
  { type: 'AUTO', icon: '🛺', label: 'Auto' },
  { type: 'CAB', icon: '🚗', label: 'Cab' },
  { type: 'EV_CAB', icon: '⚡', label: 'EV Cab' },
  { type: 'BIKE', icon: '🏍️', label: 'Bike' },
];

export default function VehicleSelectSheet({ pickup, drop, onBook, onBack }: Props) {
  const [selected, setSelected] = useState('CAB');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const { data: estimate } = useQuery({
    queryKey: ['estimate', pickup.lat, pickup.lng, drop.lat, drop.lng, selected],
    queryFn: () => api.post('/rides/estimate', { pickupLat: pickup.lat, pickupLng: pickup.lng, dropLat: drop.lat, dropLng: drop.lng, vehicleType: selected }).then(r => r.data.data),
  });

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        {VEHICLES.map(v => (
          <TouchableOpacity key={v.type} onPress={() => setSelected(v.type)}
            className={`mr-3 px-4 py-3 rounded-2xl items-center min-w-16 ${selected === v.type ? 'bg-blue-600' : 'bg-gray-100'}`}>
            <Text className="text-2xl mb-1">{v.icon}</Text>
            <Text className={`text-xs font-semibold ${selected === v.type ? 'text-white' : 'text-gray-700'}`}>{v.label}</Text>
            {estimate && <Text className={`text-xs ${selected === v.type ? 'text-blue-100' : 'text-gray-500'}`}>₹{estimate.estimatedFare}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {estimate && (
        <View className="flex-row justify-between mb-4 px-1">
          <Text className="text-sm text-gray-500">{estimate.distance?.toFixed(1)} km · ~{estimate.duration} min</Text>
          {Number(estimate.surgeMultiplier) > 1 && (
            <Text className="text-xs text-orange-600 font-medium">{estimate.surgeMultiplier}x surge</Text>
          )}
        </View>
      )}

      <View className="flex-row gap-2 mb-4">
        {['CASH', 'UPI', 'WALLET'].map(m => (
          <TouchableOpacity key={m} onPress={() => setPaymentMethod(m)}
            className={`flex-1 py-2 rounded-xl items-center ${paymentMethod === m ? 'bg-blue-50 border border-blue-300' : 'bg-gray-50 border border-gray-200'}`}>
            <Text className={`text-sm font-medium ${paymentMethod === m ? 'text-blue-600' : 'text-gray-600'}`}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={() => onBook(selected, paymentMethod)} className="bg-blue-600 rounded-2xl py-4 items-center">
        <Text className="text-white font-bold text-base">Book {VEHICLES.find(v => v.type === selected)?.icon} · ₹{estimate?.estimatedFare || '—'}</Text>
      </TouchableOpacity>
    </View>
  );
}
