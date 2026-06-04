import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Linking } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuthStore } from '../../src/stores/auth';
import { useBookingStore } from '../../src/stores/booking';
import { api } from '../../src/lib/api';
import { getSocket } from '../../src/lib/socket';
import VehicleSelectSheet from '../../src/components/VehicleSelectSheet';
import SearchingView from '../../src/components/SearchingView';
import DriverAssignedView from '../../src/components/DriverAssignedView';
import ActiveRideCustomerView from '../../src/components/ActiveRideCustomerView';

export default function HomeScreen() {
  const { token, user } = useAuthStore();
  const { step, pickup, drop, ride, driver, driverLocation, setStep, setPickup, setDrop, setRide, setDriver, setDriverLocation, reset } = useBookingStore();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [dropSearch, setDropSearch] = useState('');
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setPickup({ lat: loc.coords.latitude, lng: loc.coords.longitude, address: 'Current Location' });
    })();
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socket.on('driver_assigned', (data) => { setDriver(data.driver); setStep('assigned'); });
    socket.on('ride_status_update', (data) => {
      if (data.status === 'DRIVER_ARRIVING') setStep('arriving');
      if (data.status === 'IN_PROGRESS') setStep('in_progress');
      if (data.status === 'CANCELLED') { Alert.alert('Ride Cancelled'); reset(); }
    });
    socket.on('driver_location', (data) => setDriverLocation({ lat: data.lat, lng: data.lng }));
    socket.on('ride_completed', (data) => { setStep('completed'); });
    socket.on('no_drivers_found', () => { Alert.alert('No drivers', 'No drivers available. Please try again.'); setStep('idle'); });
    return () => { socket.off('driver_assigned'); socket.off('ride_status_update'); socket.off('driver_location'); socket.off('ride_completed'); socket.off('no_drivers_found'); };
  }, [token]);

  async function handleBookRide(vehicleType: string, paymentMethod: string) {
    if (!pickup || !drop) return;
    setStep('searching');
    try {
      const { data } = await api.post('/rides', {
        pickupLat: pickup.lat, pickupLng: pickup.lng, pickupAddress: pickup.address,
        dropLat: drop.lat, dropLng: drop.lng, dropAddress: drop.address,
        vehicleType, paymentMethod,
      });
      setRide(data.data.ride);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Could not create ride');
      setStep('idle');
    }
  }

  async function cancelRide() {
    if (!ride) return;
    await api.patch(`/rides/${ride.id}/cancel`, { cancelledBy: user?.id, reason: 'User cancelled' });
    reset();
  }

  const currentRegion = { latitude: location?.coords.latitude || 12.9716, longitude: location?.coords.longitude || 77.5946, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  if (step === 'searching') return <SearchingView onCancel={cancelRide} />;
  if (step === 'assigned' || step === 'arriving') return <DriverAssignedView driver={driver} ride={ride} driverLocation={driverLocation} onCancel={cancelRide} />;
  if (step === 'in_progress') return <ActiveRideCustomerView ride={ride} driver={driver} driverLocation={driverLocation} />;
  if (step === 'completed') return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-3xl mb-2">🎉</Text>
      <Text className="text-xl font-bold text-gray-900 mb-2">Ride Complete!</Text>
      <Text className="text-gray-500 mb-6">Fare: ₹{ride?.actualFare}</Text>
      <TouchableOpacity onPress={reset} className="bg-blue-600 rounded-2xl px-8 py-4"><Text className="text-white font-bold">Done</Text></TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1">
      <MapView ref={mapRef} className="flex-1" initialRegion={currentRegion}>
        {pickup && <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} pinColor="blue" />}
        {drop && <Marker coordinate={{ latitude: drop.lat, longitude: drop.lng }} pinColor="red" />}
      </MapView>

      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl px-6 pt-5 pb-8 shadow-2xl">
        <Text className="text-lg font-bold text-gray-900 mb-3">Where to?</Text>
        <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 mb-3">
          <View className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
          <Text className="text-gray-600 flex-1">{pickup?.address || 'Current location'}</Text>
        </View>
        <TextInput
          value={dropSearch} onChangeText={setDropSearch}
          placeholder="Enter destination"
          className="bg-gray-50 rounded-xl px-4 py-3 text-base mb-4"
          onSubmitEditing={async () => {
            if (!dropSearch.trim()) return;
            // In production, use Google Places API. For now set a mock drop.
            setDrop({ lat: 12.9352, lng: 77.6245, address: dropSearch });
            setStep('selecting');
          }}
          returnKeyType="search"
        />
        {step === 'selecting' && drop && (
          <VehicleSelectSheet pickup={pickup!} drop={drop} onBook={handleBookRide} onBack={() => setStep('idle')} />
        )}
      </View>
    </View>
  );
}
