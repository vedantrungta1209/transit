import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Phone, Share2 } from 'lucide-react-native';

interface Props { driver: any; ride: any; driverLocation: any; onCancel: () => void; }

export default function DriverAssignedView({ driver, ride, driverLocation, onCancel }: Props) {
  return (
    <View className="flex-1">
      {driverLocation && (
        <MapView className="flex-1" initialRegion={{ latitude: driverLocation.lat, longitude: driverLocation.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }}>
          <Marker coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }} title="Driver" />
          {ride?.pickupLat && <Marker coordinate={{ latitude: ride.pickupLat, longitude: ride.pickupLng }} pinColor="blue" title="Pickup" />}
        </MapView>
      )}
      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl">
        <Text className="text-lg font-bold text-gray-900 mb-1">Driver on the way</Text>
        <Text className="text-gray-500 text-sm mb-4">{driver?.vehicleNumber} · {driver?.vehicleModel}</Text>
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-base font-semibold text-gray-900">{driver?.name}</Text>
            <Text className="text-sm text-gray-500">⭐ 4.8</Text>
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${driver?.phone}`)} className="w-11 h-11 bg-green-50 rounded-full items-center justify-center">
              <Phone size={18} color="#16a34a" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Share', 'Live tracking link copied')} className="w-11 h-11 bg-blue-50 rounded-full items-center justify-center">
              <Share2 size={18} color="#0284c7" />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity onPress={onCancel} className="border border-red-200 rounded-2xl py-3 items-center">
          <Text className="text-red-600 font-medium">Cancel Ride</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
