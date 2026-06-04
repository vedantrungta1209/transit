import { View, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { AlertTriangle } from 'lucide-react-native';

interface Props { ride: any; driver: any; driverLocation: any; }

export default function ActiveRideCustomerView({ ride, driver, driverLocation }: Props) {
  return (
    <View className="flex-1">
      {driverLocation && (
        <MapView className="flex-1" initialRegion={{ latitude: driverLocation.lat, longitude: driverLocation.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
          <Marker coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }} title="Driver" />
          {ride?.dropLat && <Marker coordinate={{ latitude: ride.dropLat, longitude: ride.dropLng }} pinColor="red" title="Drop" />}
        </MapView>
      )}
      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl">
        <Text className="text-lg font-bold text-gray-900 mb-1">Ride in Progress</Text>
        <Text className="text-gray-500 text-sm mb-4">Heading to {ride?.dropAddress}</Text>
        <View className="bg-blue-50 rounded-2xl p-4 mb-4 items-center">
          <Text className="text-sm text-blue-600 mb-1">Show this OTP to driver</Text>
          <Text className="text-4xl font-bold text-blue-700 tracking-widest">{ride?.otp || '****'}</Text>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert('SOS', 'Emergency services will be contacted. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call 112', onPress: () => {} },
          ])}
          className="flex-row items-center justify-center gap-2 bg-red-600 rounded-2xl py-3"
        >
          <AlertTriangle size={18} color="white" />
          <Text className="text-white font-bold">SOS Emergency</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
