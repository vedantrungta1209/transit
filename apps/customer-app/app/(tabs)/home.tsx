import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Alert, StyleSheet,
  FlatList, ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuthStore } from '../../src/stores/auth';
import { useBookingStore } from '../../src/stores/booking';
import { api } from '../../src/lib/api';
import { getSocket } from '../../src/lib/socket';
import { T } from '../../src/lib/theme';
import VehicleSelectSheet from '../../src/components/VehicleSelectSheet';
import SearchingView from '../../src/components/SearchingView';
import DriverAssignedView from '../../src/components/DriverAssignedView';
import ActiveRideCustomerView from '../../src/components/ActiveRideCustomerView';

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY!;

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: { main_text: string; secondary_text: string };
}

function PinIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z M12 10.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z" stroke={T.AMBER_DEEP} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function SearchIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4-4" stroke={T.AMBER_DEEP} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function ShieldIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z M9 12l2 2 4-4" stroke={T.AMBER} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function LocationDotIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={T.TEXT_MUTED} strokeWidth={1.7} />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={T.TEXT_MUTED} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { latlng: `${lat},${lng}`, key: MAPS_KEY, result_type: 'street_address|route|sublocality' },
    });
    const result = res.data.results[0];
    if (!result) return 'Current Location';
    const parts = result.address_components.slice(0, 3).map((c: any) => c.short_name);
    return parts.join(', ');
  } catch {
    return 'Current Location';
  }
}

export default function HomeScreen() {
  const { token, user } = useAuthStore();
  const { step, pickup, drop, ride, driver, driverLocation, setStep, setPickup, setDrop, setRide, setDriver, setDriverLocation, reset } = useBookingStore();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [dropSearch, setDropSearch] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dropFocused, setDropFocused] = useState(false);
  const mapRef = useRef<MapView>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get GPS + reverse geocode pickup
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location required', 'Please enable location access to book a ride.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc);
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 600);
      const address = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
      setPickup({ lat: loc.coords.latitude, lng: loc.coords.longitude, address });
    })();
  }, []);

  // Socket events
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socket.on('driver_assigned', (data) => { setDriver(data.driver); setStep('assigned'); });
    socket.on('ride_status_update', (data) => {
      if (data.status === 'DRIVER_ARRIVING') setStep('arriving');
      if (data.status === 'IN_PROGRESS') setStep('in_progress');
      if (data.status === 'CANCELLED') { Alert.alert('Ride Cancelled', 'Your ride was cancelled.'); reset(); }
    });
    socket.on('driver_location', (data) => setDriverLocation({ lat: data.lat, lng: data.lng }));
    socket.on('ride_completed', () => setStep('completed'));
    socket.on('no_drivers_found', () => { Alert.alert('No drivers', 'No drivers available nearby. Try again in a few minutes.'); setStep('idle'); });
    return () => {
      socket.off('driver_assigned'); socket.off('ride_status_update');
      socket.off('driver_location'); socket.off('ride_completed'); socket.off('no_drivers_found');
    };
  }, [token]);

  const searchPlaces = useCallback((text: string) => {
    setDropSearch(text);
    setPredictions([]);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.length < 2) return;
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
          params: {
            input: text,
            key: MAPS_KEY,
            components: 'country:in',
            language: 'en',
            types: 'geocode|establishment',
            ...(location ? { location: `${location.coords.latitude},${location.coords.longitude}`, radius: 50000 } : {}),
          },
        });
        if (res.data.status === 'OK' || res.data.status === 'ZERO_RESULTS') {
          setPredictions(res.data.predictions || []);
        }
      } catch (e) {
        // Network error — silent
      }
      setSearchLoading(false);
    }, 350);
  }, [location]);

  async function selectPrediction(p: Prediction) {
    Keyboard.dismiss();
    setDropSearch(p.description);
    setPredictions([]);
    setDropFocused(false);
    try {
      const res = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: { place_id: p.place_id, key: MAPS_KEY, fields: 'geometry,formatted_address' },
      });
      const loc = res.data.result?.geometry?.location;
      if (!loc) { Alert.alert('Error', 'Could not get location details. Try again.'); return; }
      setDrop({ lat: loc.lat, lng: loc.lng, address: p.description });
      setStep('selecting');
      if (pickup) {
        mapRef.current?.animateToRegion({
          latitude: (pickup.lat + loc.lat) / 2,
          longitude: (pickup.lng + loc.lng) / 2,
          latitudeDelta: Math.abs(pickup.lat - loc.lat) * 2.5 + 0.03,
          longitudeDelta: Math.abs(pickup.lng - loc.lng) * 2.5 + 0.03,
        }, 600);
      }
    } catch {
      Alert.alert('Error', 'Could not resolve this location. Please try again.');
    }
  }

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
      Alert.alert('Booking failed', e.response?.data?.error || 'Could not create ride. Please try again.');
      setStep('idle');
    }
  }

  async function cancelRide() {
    if (!ride) return;
    try {
      await api.patch(`/rides/${ride.id}/cancel`, { cancelledBy: user?.id, reason: 'User cancelled' });
    } catch { /* silent */ }
    reset();
  }

  const mapRegion = {
    latitude: location?.coords.latitude ?? 12.9716,
    longitude: location?.coords.longitude ?? 77.5946,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  if (step === 'searching') return <SearchingView onCancel={cancelRide} />;
  if (step === 'assigned' || step === 'arriving') return <DriverAssignedView driver={driver} ride={ride} driverLocation={driverLocation} onCancel={cancelRide} />;
  if (step === 'in_progress') return <ActiveRideCustomerView ride={ride} driver={driver} driverLocation={driverLocation} />;

  if (step === 'completed') {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: T.PAPER, paddingHorizontal: 20, paddingTop: 60, alignItems: 'center' }]}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: T.SUCCESS_SOFT, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12.5l4.5 4.5L19 7" stroke={T.SUCCESS} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <Text style={s.arrivedTitle}>You've arrived</Text>
        <Text style={s.arrivedSub}>Fare: ₹{ride?.actualFare?.toLocaleString('en-IN')}</Text>
        <View style={[s.card, { width: '100%', marginTop: 20 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <Text style={s.eyebrow}>Receipt</Text>
            <Text style={s.mono}>#TR-{ride?.id?.slice(-5).toUpperCase()}</Text>
          </View>
          {[['Ride fare', ride?.actualFare], ['Booking fee', 6]].map(([l, v]) => (
            <View key={l as string} style={s.receiptRow}>
              <Text style={s.receiptLabel}>{l as string}</Text>
              <Text style={s.receiptVal}>{v ? `₹${Number(v).toLocaleString('en-IN')}` : '—'}</Text>
            </View>
          ))}
          <View style={s.dashed} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
            <Text style={[s.bold16, { color: T.TEXT }]}>Total</Text>
            <Text style={[s.bold22, { color: T.TEXT }]}>₹{(Number(ride?.actualFare || 0) + 6).toLocaleString('en-IN')}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={reset} style={[s.amberBtn, { marginTop: 20, width: '100%' }]}>
          <Text style={s.amberBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const showPredictions = predictions.length > 0 && dropFocused;
  const showVehicles = step === 'selecting' && drop && !showPredictions;

  return (
    <View style={{ flex: 1 }}>
      {/* Map fills background */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={mapRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {pickup && <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} pinColor={T.NAVY} />}
        {drop && <Marker coordinate={{ latitude: drop.lat, longitude: drop.lng }} pinColor={T.AMBER} />}
      </MapView>

      {/* Top bar — pickup location */}
      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={s.topBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <PinIcon />
            <View style={{ flex: 1 }}>
              <Text style={s.topBarLabel}>Pickup</Text>
              <Text style={s.topBarCity} numberOfLines={1}>
                {pickup ? pickup.address : 'Locating your position…'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={s.avatar}>
            <Text style={s.avatarText}>{user?.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Bottom area with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={s.kavWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={s.sheet}>
          <View style={s.sheetHandle} />

          {/* Drop search */}
          <View style={s.searchBox}>
            <SearchIcon />
            <TextInput
              value={dropSearch}
              onChangeText={searchPlaces}
              onFocus={() => setDropFocused(true)}
              onBlur={() => setTimeout(() => setDropFocused(false), 200)}
              placeholder="Where to?"
              placeholderTextColor={T.TEXT_FAINT}
              style={s.searchInput}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchLoading && <ActivityIndicator size="small" color={T.AMBER_DEEP} />}
            {dropSearch.length > 0 && !searchLoading && (
              <TouchableOpacity onPress={() => { setDropSearch(''); setPredictions([]); setDrop(null); setStep('idle'); }}>
                <Text style={{ color: T.TEXT_FAINT, fontSize: 18, lineHeight: 20 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Autocomplete list */}
          {showPredictions && (
            <View style={s.predictionsContainer}>
              <FlatList
                data={predictions}
                keyExtractor={p => p.place_id}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[s.predictionRow, index > 0 && { borderTopWidth: 1, borderTopColor: T.LINE }]}
                    onPress={() => selectPrediction(item)}
                  >
                    <View style={s.predictionIcon}>
                      <LocationDotIcon />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.predictionMain} numberOfLines={1}>
                        {item.structured_formatting?.main_text || item.description}
                      </Text>
                      <Text style={s.predictionSub} numberOfLines={1}>
                        {item.structured_formatting?.secondary_text}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Vehicle select */}
          {showVehicles && (
            <VehicleSelectSheet
              pickup={pickup!}
              drop={drop}
              onBook={handleBookRide}
              onBack={() => { setStep('idle'); setDropSearch(''); setDrop(null); }}
            />
          )}

          {/* Default idle state */}
          {!showPredictions && !showVehicles && (
            <View style={s.promoBanner}>
              <ShieldIcon />
              <View>
                <Text style={s.promoTitle}>Every fare, upfront</Text>
                <Text style={s.promoSub}>The price you see is the price you pay.</Text>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  kavWrapper: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: T.SURFACE, borderRadius: T.R_MD,
    paddingHorizontal: 16, paddingVertical: 10,
    ...T.SHADOW_MD,
  },
  topBarLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 1.6, color: T.TEXT_FAINT, textTransform: 'uppercase' },
  topBarCity: { fontSize: 14, fontWeight: '600', color: T.TEXT },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: T.NAVY, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  sheet: {
    backgroundColor: T.SURFACE,
    borderTopLeftRadius: T.R_XL, borderTopRightRadius: T.R_XL,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    ...T.SHADOW_SHEET,
  },
  sheetHandle: { width: 40, height: 5, borderRadius: 99, backgroundColor: T.LINE, alignSelf: 'center', marginBottom: 16 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.SURFACE_2, borderRadius: T.R_MD,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: T.LINE, marginBottom: 12,
    ...T.SHADOW_SM,
  },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '600', color: T.TEXT },
  predictionsContainer: {
    backgroundColor: T.SURFACE, borderRadius: T.R_MD,
    borderWidth: 1, borderColor: T.LINE,
    marginBottom: 8, overflow: 'hidden',
    ...T.SHADOW_SM,
  },
  predictionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  predictionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: T.SURFACE_2, alignItems: 'center', justifyContent: 'center' },
  predictionMain: { fontSize: 14, fontWeight: '600', color: T.TEXT },
  predictionSub: { fontSize: 12, color: T.TEXT_MUTED, marginTop: 1 },
  promoBanner: {
    backgroundColor: T.NAVY, borderRadius: T.R_LG, paddingHorizontal: 18, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  promoTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  promoSub: { fontSize: 12.5, color: T.ON_NAVY_MUT, marginTop: 2 },
  // Completed screen
  arrivedTitle: { fontSize: 22, fontWeight: '600', color: T.TEXT },
  arrivedSub: { fontSize: 14, color: T.TEXT_MUTED, marginTop: 3 },
  card: { backgroundColor: T.SURFACE, borderRadius: T.R_LG, padding: 20, ...T.SHADOW_SM, borderWidth: 1, borderColor: T.LINE },
  eyebrow: { fontSize: 11, fontWeight: '600', letterSpacing: 1.6, color: T.TEXT_FAINT, textTransform: 'uppercase' },
  mono: { fontSize: 12, color: T.TEXT_FAINT },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  receiptLabel: { fontSize: 14, color: T.TEXT_MUTED },
  receiptVal: { fontSize: 14, color: T.TEXT, fontWeight: '500' },
  dashed: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: T.LINE, marginVertical: 8 },
  bold16: { fontSize: 16, fontWeight: '600' },
  bold22: { fontSize: 22, fontWeight: '700' },
  amberBtn: { height: 56, borderRadius: T.R_MD, backgroundColor: T.AMBER, alignItems: 'center', justifyContent: 'center', ...T.SHADOW_AMBER },
  amberBtnText: { fontSize: 17, fontWeight: '600', color: T.ON_AMBER },
});
