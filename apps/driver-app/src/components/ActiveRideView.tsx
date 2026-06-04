import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { api } from '../lib/api';

interface Props { ride: any; onUpdate: (r: any) => void; }

const STEPS = { DRIVER_ASSIGNED: 0, DRIVER_ARRIVING: 1, IN_PROGRESS: 2, COMPLETED: 3 };

export default function ActiveRideView({ ride, onUpdate }: Props) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const step = STEPS[ride.status as keyof typeof STEPS] ?? 0;

  async function arrive() {
    setLoading(true);
    try {
      const { data } = await api.patch(`/rides/${ride.id}/arrive`);
      onUpdate(data.data);
    } finally { setLoading(false); }
  }

  async function startRide() {
    if (otp.length !== 4) return Alert.alert('Enter 4-digit OTP from customer');
    setLoading(true);
    try {
      const { data } = await api.patch(`/rides/${ride.id}/start`, { otp });
      onUpdate(data.data);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Invalid OTP');
    } finally { setLoading(false); }
  }

  async function completeRide() {
    Alert.alert('Complete Ride', 'Are you sure you have reached the destination?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: async () => {
        setLoading(true);
        try {
          const { data } = await api.patch(`/rides/${ride.id}/complete`);
          Alert.alert('Ride Complete!', `Fare: ₹${data.data.actualFare}`);
          onUpdate(null);
        } finally { setLoading(false); }
      }},
    ]);
  }

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6 pb-10">
      <Text className="text-lg font-bold text-gray-900 mb-1">
        {step === 0 ? 'Navigate to Pickup' : step === 1 ? 'Arrived at Pickup' : step === 2 ? 'Ride in Progress' : 'Completed'}
      </Text>
      <Text className="text-gray-500 text-sm mb-5">{ride.pickupAddress}</Text>

      {step === 0 && (
        <TouchableOpacity onPress={arrive} disabled={loading} className="bg-blue-600 rounded-2xl py-4 items-center">
          <Text className="text-white font-semibold text-base">I Have Arrived</Text>
        </TouchableOpacity>
      )}

      {step === 1 && (
        <View>
          <TextInput
            value={otp} onChangeText={setOtp}
            placeholder="Enter 4-digit OTP" keyboardType="number-pad" maxLength={4}
            className="border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-bold mb-4 tracking-widest"
          />
          <TouchableOpacity onPress={startRide} disabled={loading} className="bg-green-600 rounded-2xl py-4 items-center">
            <Text className="text-white font-semibold text-base">Start Ride</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <TouchableOpacity onPress={completeRide} disabled={loading} className="bg-green-600 rounded-2xl py-4 items-center">
          <Text className="text-white font-semibold text-base">Complete Ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
