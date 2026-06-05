import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useAuthStore } from '../../src/stores/auth';
import { useBookingStore } from '../../src/stores/booking';
import { api } from '../../src/lib/api';
import { getSocket } from '../../src/lib/socket';
import { T } from '../../src/lib/theme';
import VehicleSelectSheet from '../../src/components/VehicleSelectSheet';
import SearchingView from '../../src/components/SearchingView';
import DriverAssignedView from '../../src/components/DriverAssignedView';
import ActiveRideCustomerView from '../../src/components/ActiveRideCustomerView';

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
function ChevDownIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 9l7 7 7-7" stroke={T.TEXT_MUTED} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const SAVED = [
  { icon: '🏠', label: 'Home', sub: 'B-204, Hill View, Gomti Nagar' },
  { icon: '💼', label: 'Office', sub: 'Cyber Heights, Vibhuti Khand' },
];

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
    socket.on('ride_completed', () => setStep('completed'));
    socket.on('no_drivers_found', () => { Alert.alert('No drivers', 'No drivers available. Please try again.'); setStep('idle'); });
    return () => {
      socket.off('driver_assigned');
      socket.off('ride_status_update');
      socket.off('driver_location');
      socket.off('ride_completed');
      socket.off('no_drivers_found');
    };
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

  const currentRegion = {
    latitude: location?.coords.latitude || 26.8467,
    longitude: location?.coords.longitude || 80.9462,
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

        {/* Receipt */}
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
            <Text style={[s.bold16, { color: T.TEXT }]}>Total · Cash</Text>
            <Text style={[s.bold22, { color: T.TEXT }]}>₹{(Number(ride?.actualFare || 0) + 6).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Rating */}
        <Text style={[s.bold16, { color: T.TEXT, marginTop: 22, marginBottom: 12 }]}>Rate your ride</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <Text key={i} style={{ fontSize: 30 }}>{i <= 4 ? '★' : '☆'}</Text>
          ))}
        </View>
        <TouchableOpacity onPress={reset} style={s.amberBtn}>
          <Text style={s.amberBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={currentRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {pickup && <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} pinColor={T.NAVY} />}
        {drop && <Marker coordinate={{ latitude: drop.lat, longitude: drop.lng }} pinColor={T.AMBER} />}
      </MapView>

      {/* Top bar */}
      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={s.topBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PinIcon />
            <View>
              <Text style={s.topBarLabel}>Pickup</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={s.topBarCity}>{pickup?.address?.split(',')[0] || 'Locating...'}</Text>
                <ChevDownIcon />
              </View>
            </View>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.name ? user.name.slice(0, 2).toUpperCase() : 'RA'}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom sheet */}
      <View style={s.sheet}>
        <View style={s.sheetHandle} />

        {/* Where to? */}
        <TouchableOpacity
          style={s.searchBox}
          onPress={() => setStep(step === 'idle' ? 'idle' : 'idle')}
        >
          <SearchIcon />
          <TextInput
            value={dropSearch}
            onChangeText={setDropSearch}
            placeholder="Where to?"
            placeholderTextColor={T.TEXT_FAINT}
            style={s.searchInput}
            onSubmitEditing={() => {
              if (!dropSearch.trim()) return;
              setDrop({ lat: 26.8600, lng: 80.9961, address: dropSearch });
              setStep('selecting');
            }}
            returnKeyType="search"
          />
          {dropSearch.length > 0 && (
            <TouchableOpacity onPress={() => { setDropSearch(''); setDrop(null); setStep('idle'); }}>
              <Text style={{ color: T.TEXT_FAINT, fontSize: 13 }}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {step === 'selecting' && drop ? (
          <VehicleSelectSheet pickup={pickup!} drop={drop} onBook={handleBookRide} onBack={() => { setStep('idle'); setDropSearch(''); setDrop(null); }} />
        ) : (
          <>
            {/* Saved places */}
            <View style={s.savedCard}>
              {SAVED.map((r, k) => (
                <TouchableOpacity
                  key={r.label}
                  style={[s.savedRow, k > 0 && { borderTopWidth: 1, borderTopColor: T.LINE }]}
                  onPress={() => { setDropSearch(r.label); setDrop({ lat: 26.865, lng: 80.996, address: r.sub }); setStep('selecting'); }}
                >
                  <View style={s.savedIcon}>
                    <Text style={{ fontSize: 17 }}>{r.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.savedLabel}>{r.label}</Text>
                    <Text style={s.savedSub} numberOfLines={1}>{r.sub}</Text>
                  </View>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M9 5l7 7-7 7" stroke={T.TEXT_FAINT} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </TouchableOpacity>
              ))}
            </View>

            {/* Promo banner */}
            <View style={s.promoBanner}>
              <ShieldIcon />
              <View>
                <Text style={s.promoTitle}>Every fare, upfront</Text>
                <Text style={s.promoSub}>The price you see is the price you pay.</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: T.SURFACE,
    borderRadius: T.R_MD,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...T.SHADOW_MD,
  },
  topBarLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 1.6, color: T.TEXT_FAINT, textTransform: 'uppercase' },
  topBarCity: { fontSize: 14, fontWeight: '600', color: T.TEXT },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: T.NAVY, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: T.SURFACE,
    borderTopLeftRadius: T.R_XL,
    borderTopRightRadius: T.R_XL,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
    ...T.SHADOW_SHEET,
  },
  sheetHandle: { width: 40, height: 5, borderRadius: 99, backgroundColor: T.LINE, alignSelf: 'center', marginBottom: 16 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.SURFACE_2, borderRadius: T.R_MD,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: T.LINE, marginBottom: 16,
    ...T.SHADOW_SM,
  },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '600', color: T.TEXT },
  savedCard: { backgroundColor: T.SURFACE, borderRadius: T.R_MD, overflow: 'hidden', marginBottom: 14, ...T.SHADOW_SM, borderWidth: 1, borderColor: T.LINE },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  savedIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: T.AMBER_SOFT, alignItems: 'center', justifyContent: 'center' },
  savedLabel: { fontSize: 15, fontWeight: '600', color: T.TEXT },
  savedSub: { fontSize: 12.5, color: T.TEXT_MUTED, marginTop: 1 },
  promoBanner: {
    backgroundColor: T.NAVY, borderRadius: T.R_LG, paddingHorizontal: 18, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden',
  },
  promoTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  promoSub: { fontSize: 12.5, color: T.ON_NAVY_MUT, marginTop: 2 },
  // Completed screen
  arrivedTitle: { fontSize: 22, fontWeight: '600', color: T.TEXT },
  arrivedSub: { fontSize: 14, color: T.TEXT_MUTED, marginTop: 3 },
  card: { backgroundColor: T.SURFACE, borderRadius: T.R_LG, padding: 20, ...T.SHADOW_SM, borderWidth: 1, borderColor: T.LINE },
  eyebrow: { fontSize: 11, fontWeight: '600', letterSpacing: 1.6, color: T.TEXT_FAINT, textTransform: 'uppercase' },
  mono: { fontSize: 12, color: T.TEXT_FAINT, fontVariant: ['tabular-nums'] },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  receiptLabel: { fontSize: 14, color: T.TEXT_MUTED },
  receiptVal: { fontSize: 14, color: T.TEXT, fontWeight: '500' },
  dashed: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: T.LINE, marginVertical: 8 },
  bold16: { fontSize: 16, fontWeight: '600' },
  bold22: { fontSize: 22, fontWeight: '700' },
  amberBtn: {
    width: '100%', height: 56, borderRadius: T.R_MD, backgroundColor: T.AMBER,
    alignItems: 'center', justifyContent: 'center', ...T.SHADOW_AMBER,
  },
  amberBtnText: { fontSize: 17, fontWeight: '600', color: T.ON_AMBER },
});
