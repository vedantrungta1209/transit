import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '../../src/stores/auth';
import { useRideStore } from '../../src/stores/ride';
import { api } from '../../src/lib/api';
import { getSocket } from '../../src/lib/socket';
import { T } from '../../src/lib/theme';
import RideRequestSheet from '../../src/components/RideRequestSheet';
import ActiveRideView from '../../src/components/ActiveRideView';

function money(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function HomeScreen() {
  const { token, driver } = useAuthStore();
  const { currentRequest, activeRide, setRequest, setActiveRide } = useRideStore();
  const [isOnline, setIsOnline] = useState(driver?.isOnline || false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const mapRef = useRef<MapView>(null);
  const locationInterval = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Location permission required');
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
    // Fetch today's earnings
    api.get('/drivers/me/earnings').then(r => {
      setTodayEarnings(r.data?.data?.today || 0);
    }).catch(() => {});
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
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1, backgroundColor: '#0A1C40' }}
        initialRegion={{
          latitude: location?.coords.latitude || 26.8467,
          longitude: location?.coords.longitude || 80.9462,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        customMapStyle={darkMapStyle}
      >
        {location && (
          <Marker coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}>
            <View style={s.carMarker}>
              <Text style={{ fontSize: 18 }}>🛺</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Status banner */}
      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={s.statusBar}>
          <View style={[s.statusDot, { backgroundColor: isOnline ? T.SUCCESS : T.TEXT_FAINT }]} />
          <View style={{ flex: 1 }}>
            <Text style={s.statusTitle}>{isOnline ? "You're online" : "You're offline"}</Text>
            <Text style={s.statusSub}>
              {isOnline ? `Finding rides near ${location ? 'your area' : '...'}` : 'Go online to start receiving requests'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ false: T.TEXT_FAINT + '80', true: T.SUCCESS }}
            thumbColor={T.SURFACE}
          />
        </View>
      </SafeAreaView>

      {/* Bottom sheet */}
      {!currentRequest && !activeRide && (
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.earningsRow}>
            <View>
              <Text style={s.earningsLabel}>Today's earnings</Text>
              <Text style={s.earningsAmount}>{money(todayEarnings)}</Text>
            </View>
            <View style={s.keepBadge}>
              <Text style={{ fontSize: 13, marginRight: 4 }}>✓</Text>
              <Text style={s.keepBadgeText}>You keep 100%</Text>
            </View>
          </View>

          <View style={s.statsRow}>
            {[['Trips', '—'], ['Online', '0h 0m'], ['Accept', '—%']].map(([l, v]) => (
              <View key={l} style={s.statBox}>
                <Text style={s.statValue}>{v}</Text>
                <Text style={s.statLabel}>{l}</Text>
              </View>
            ))}
          </View>

          <View style={s.trialBanner}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>🎁</Text>
            <Text style={s.trialText}>Free trial — 3 months free, then ₹299/mo</Text>
            <Text style={s.trialCta}>Plan</Text>
          </View>
        </View>
      )}

      {currentRequest && !activeRide && (
        <RideRequestSheet request={currentRequest} onAccept={acceptRide} onDecline={() => setRequest(null)} />
      )}
      {activeRide && <ActiveRideView ride={activeRide} onUpdate={setActiveRide} />}
    </View>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0A1C40' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#071633' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5C6B86' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#16264a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c2348' }] },
];

const s = StyleSheet.create({
  carMarker: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: T.AMBER, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
    ...T.SHADOW_AMBER,
  },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: T.NAVY, borderRadius: T.R_MD,
    paddingHorizontal: 16, paddingVertical: 12, ...T.SHADOW_MD,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusTitle: { fontSize: 15, fontWeight: '600', color: T.ON_NAVY },
  statusSub: { fontSize: 12, color: T.ON_NAVY_MUT, marginTop: 1 },
  sheet: {
    backgroundColor: T.SURFACE, borderTopLeftRadius: T.R_XL, borderTopRightRadius: T.R_XL,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30, ...T.SHADOW_SHEET,
  },
  handle: { width: 40, height: 5, borderRadius: 99, backgroundColor: T.LINE, alignSelf: 'center', marginBottom: 16 },
  earningsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6 },
  earningsLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.4, color: T.TEXT_FAINT, textTransform: 'uppercase', marginBottom: 2 },
  earningsAmount: { fontSize: 40, fontWeight: '700', color: T.TEXT, letterSpacing: -1, lineHeight: 44 },
  keepBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.SUCCESS_SOFT, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: T.R_PILL,
  },
  keepBadgeText: { fontSize: 12.5, fontWeight: '600', color: T.SUCCESS },
  statsRow: { flexDirection: 'row', gap: 10, marginVertical: 16 },
  statBox: { flex: 1, backgroundColor: T.SURFACE_2, borderRadius: T.R_SM, paddingHorizontal: 14, paddingVertical: 12 },
  statValue: { fontSize: 20, fontWeight: '700', color: T.TEXT },
  statLabel: { fontSize: 12, color: T.TEXT_MUTED, marginTop: 1 },
  trialBanner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderRadius: T.R_SM, borderWidth: 1, borderColor: T.AMBER_LINE,
    backgroundColor: T.AMBER_SOFT,
  },
  trialText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: T.TEXT },
  trialCta: { fontSize: 13, fontWeight: '600', color: T.AMBER_DEEP },
});
