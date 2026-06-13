import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAuthStore } from '../../src/stores/auth';
import { useRideStore } from '../../src/stores/ride';
import { api } from '../../src/lib/api';
import { getSocket } from '../../src/lib/socket';
import { T } from '../../src/lib/theme';
import RideRequestSheet from '../../src/components/RideRequestSheet';
import ActiveRideView from '../../src/components/ActiveRideView';

const BANGALORE = { latitude: 12.9716, longitude: 77.5946 };

function money(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function TransitDriverIcon({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="dField" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F7B32B" />
          <Stop offset="1" stopColor="#E8941A" />
        </LinearGradient>
      </Defs>
      <Rect x="6" y="6" width="108" height="108" rx="28" fill="url(#dField)" />
      <Rect x="32" y="33" width="56" height="13.5" rx="6.75" fill="#0F2B5B" />
      <Path d="M53 44 L67 44 L67 70 L78 86 L70 90 L60 80 L50 90 L42 86 L53 70 Z" fill="#0F2B5B" />
    </Svg>
  );
}

export default function HomeScreen() {
  const { token, driver } = useAuthStore();
  const { currentRequest, activeRide, setRequest, setActiveRide } = useRideStore();
  const [isOnline, setIsOnline] = useState(driver?.isOnline || false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayTrips, setTodayTrips] = useState(0);
  const [onlineMinutes, setOnlineMinutes] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const mapRef = useRef<MapView>(null);
  const locationInterval = useRef<any>(null);
  const onlineStart = useRef<number | null>(null);
  const onlineTimer = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Location permission required'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc);
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 600);
    })();
    api.get('/drivers/me/earnings').then(r => {
      setTodayEarnings(r.data?.data?.today || 0);
      setTodayTrips(r.data?.data?.todayTrips || 0);
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
      onlineStart.current = Date.now();
      onlineTimer.current = setInterval(() => {
        if (onlineStart.current) {
          setOnlineMinutes(Math.floor((Date.now() - onlineStart.current) / 60000));
        }
      }, 30000);
      locationInterval.current = setInterval(async () => {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(loc);
        mapRef.current?.animateToRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 400);
        await api.patch('/drivers/me/location', {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          heading: loc.coords.heading,
        });
      }, 15000);
    } else {
      if (locationInterval.current) clearInterval(locationInterval.current);
      if (onlineTimer.current) clearInterval(onlineTimer.current);
      onlineStart.current = null;
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

  const mapRegion = location
    ? { latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : { ...BANGALORE, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  const onlineHours = Math.floor(onlineMinutes / 60);
  const onlineMins = onlineMinutes % 60;
  const onlineStr = isOnline ? `${onlineHours}h ${onlineMins}m` : '0h 0m';

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1, backgroundColor: '#0A1C40' }}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        customMapStyle={darkMapStyle}
        showsUserLocation={false}
      >
        {location && (
          <Marker coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}>
            <View style={s.carMarker}>
              <Text style={{ fontSize: 18 }}>🛺</Text>
            </View>
          </Marker>
        )}
        {showHeatmap && heatmapPoints.map((p, i) => (
          <Circle
            key={i}
            center={{ latitude: p.latitude, longitude: p.longitude }}
            radius={400 * (p.weight || 1)}
            fillColor={`rgba(247,179,43,${0.12 + (p.weight || 0.5) * 0.18})`}
            strokeColor={`rgba(232,148,26,${0.3 + (p.weight || 0.5) * 0.2})`}
            strokeWidth={1}
          />
        ))}
      </MapView>

      {/* Status banner */}
      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={s.statusBar}>
          <TransitDriverIcon size={36} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[s.statusDot, { backgroundColor: isOnline ? T.SUCCESS : T.TEXT_FAINT }]} />
              <Text style={s.statusTitle}>{isOnline ? "You're online" : "You're offline"}</Text>
            </View>
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
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={s.keepBadge}>
                <Text style={{ fontSize: 13, marginRight: 4 }}>✓</Text>
                <Text style={s.keepBadgeText}>You keep 100%</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowHeatmap(h => !h)}
                style={[s.heatmapToggle, showHeatmap && { backgroundColor: T.AMBER_SOFT, borderColor: T.AMBER_LINE }]}
              >
                <Text style={[s.heatmapToggleText, showHeatmap && { color: T.AMBER_DEEP }]}>
                  {showHeatmap ? '🔥 Hide demand' : '🔥 Show demand'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.statsRow}>
            {[['Trips', String(todayTrips || '—')], ['Online', onlineStr], ['Accept', '—%']].map(([l, v]) => (
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

          <Text style={s.brandTag}>by Shankh Technologies</Text>
        </View>
      )}

      {currentRequest && !activeRide && (
        <RideRequestSheet request={currentRequest} onAccept={acceptRide} onDecline={() => setRequest(null)} />
      )}
      {activeRide && <ActiveRideView ride={activeRide} onUpdate={setActiveRide} />}
    </View>
  );
}

const heatmapPoints = [
  { latitude: 12.9716, longitude: 77.5946, weight: 1 },
  { latitude: 12.9731, longitude: 77.6001, weight: 0.8 },
  { latitude: 12.9690, longitude: 77.5901, weight: 0.9 },
  { latitude: 12.9750, longitude: 77.5970, weight: 0.7 },
  { latitude: 12.9705, longitude: 77.6050, weight: 0.6 },
];

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
    paddingHorizontal: 14, paddingVertical: 10, ...T.SHADOW_MD,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusTitle: { fontSize: 14, fontWeight: '600', color: T.ON_NAVY },
  statusSub: { fontSize: 11.5, color: T.ON_NAVY_MUT, marginTop: 1 },
  sheet: {
    backgroundColor: T.SURFACE, borderTopLeftRadius: T.R_XL, borderTopRightRadius: T.R_XL,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30, ...T.SHADOW_SHEET,
  },
  handle: { width: 40, height: 5, borderRadius: 99, backgroundColor: T.LINE, alignSelf: 'center', marginBottom: 16 },
  earningsRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  earningsLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.4, color: T.TEXT_FAINT, textTransform: 'uppercase', marginBottom: 2 },
  earningsAmount: { fontSize: 40, fontWeight: '700', color: T.TEXT, letterSpacing: -1, lineHeight: 44 },
  keepBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.SUCCESS_SOFT, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: T.R_PILL,
  },
  keepBadgeText: { fontSize: 12.5, fontWeight: '600', color: T.SUCCESS },
  heatmapToggle: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: T.R_PILL, borderWidth: 1, borderColor: T.LINE,
    backgroundColor: T.SURFACE,
  },
  heatmapToggleText: { fontSize: 12, fontWeight: '600', color: T.TEXT_MUTED },
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
  brandTag: { textAlign: 'center', fontSize: 11, color: T.TEXT_FAINT, marginTop: 10 },
});
