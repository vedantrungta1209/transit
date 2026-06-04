import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';

interface Props {
  request: { rideId: string; distanceToPickup: string; vehicleType: string; timeoutSeconds: number };
  onAccept: (rideId: string) => void;
  onDecline: () => void;
}

export default function RideRequestSheet({ request, onAccept, onDecline }: Props) {
  const [timeLeft, setTimeLeft] = useState(request.timeoutSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); onDecline(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [request.rideId]);

  const progress = timeLeft / request.timeoutSeconds;

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6 pb-10">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold text-gray-900">New Ride Request</Text>
        <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center">
          <Text className="text-blue-600 font-bold text-lg">{timeLeft}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2 mb-2">
        <Navigation size={16} color="#6b7280" />
        <Text className="text-gray-600">{request.distanceToPickup} km to pickup</Text>
      </View>
      <View className="flex-row items-center gap-2 mb-6">
        <MapPin size={16} color="#6b7280" />
        <Text className="text-gray-600">{request.vehicleType}</Text>
      </View>

      <View className="h-1 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <View className="h-full bg-blue-500 rounded-full" style={{ width: `${progress * 100}%` }} />
      </View>

      <View className="flex-row gap-4">
        <TouchableOpacity onPress={onDecline} className="flex-1 py-4 rounded-2xl bg-gray-100 items-center">
          <Text className="text-gray-700 font-semibold text-base">Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onAccept(request.rideId)} className="flex-1 py-4 rounded-2xl bg-green-500 items-center">
          <Text className="text-white font-semibold text-base">Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
