import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuthStore } from '../../src/stores/auth';
import { useRideStore } from '../../src/stores/ride';
import { api } from '../../src/lib/api';
import { getSocket } from '../../src/lib/socket';
import RideRequestSheet from '../../src/components/RideRequestSheet';
import ActiveRideView from '../../src/components/ActiveRideView';

export default function HomeScreen() {
  const { token, driver } = useAuthStore();
  const { currentRequest, activeRide, setRequest, setActiveRide } = useRideStore();
  const [isOnline, setIsOnline] = useState(driver?.isOnline || false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const mapRef = useRef<MapView>(null);
  const locationInterval = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Location permission required');
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socket.on('ride_request', (data) => setRequest(data));
    socket.on('ride_status_update', (data) => {
      if (data.status === 'CANCELLED') setActiveRide(null);
    });
    return () => { socket.off('ride_request'); socket.off('ride_status_update'); };
  }, [token]);

  async function toggleOnline(val: boolean) {
    setIsOnline(val);
    await api.patch('/drivers/me/online', { isOnline: val });
    if (val) {
      locationInterval.current = setInterval(async () => {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        await api.patch('/drivers/me/location', { lat: loc.coords.latitude, lng: loc.coords.longitude, heading: loc.coords.heading });
      }, 30000);
    } else {
      if (locationInterval.current) clearInterval(locationInterval.current);
    }
  }

  async function acceptRide(rideId: string) {
    try {
      const { data } = await api.patch(`/rides/${rideId}/accept`);
      setActiveRide(data.data);
      setRequest(null);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Could not accept ride');
      setRequest(null);
    }
  }

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        className="flex-1"
        initialRegion={{ latitude: location?.coords.latitude || 12.9716, longitude: location?.coords.longitude || 77.5946, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      >
        {location && <Marker coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }} title="You" />}
      </MapView>

      <View className="absolute top-12 left-4 right-4 flex-row items-center justify-between bg-white rounded-2xl shadow-lg px-5 py-3">
        <View>
          <Text className="text-sm text-gray-500">{isOnline ? 'You are Online' : 'You are Offline'}</Text>
          <Text className="text-xs text-gray-400">{driver?.name}</Text>
        </View>
        <Switch value={isOnline} onValueChange={toggleOnline} trackColor={{ true: '#0284c7' }} />
      </View>

      {currentRequest && !activeRide && (
        <RideRequestSheet request={currentRequest} onAccept={acceptRide} onDecline={() => setRequest(null)} />
      )}
      {activeRide && <ActiveRideView ride={activeRide} onUpdate={setActiveRide} />}
    </View>
  );
}
