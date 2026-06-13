import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Svg, { Path } from 'react-native-svg';
import { T } from '../lib/theme';

interface Props { driver: any; ride: any; driverLocation: any; onCancel: () => void; }

function NavIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M3 11l18-8-8 18-2-7z" stroke={T.AMBER} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function DriverAssignedView({ driver, ride, driverLocation, onCancel }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: driverLocation?.lat || 12.9716,
          longitude: driverLocation?.lng || 77.5946,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        showsUserLocation
      >
        {driverLocation && <Marker coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }} />}
        {ride?.pickupLat && <Marker coordinate={{ latitude: ride.pickupLat, longitude: ride.pickupLng }} pinColor={T.NAVY} />}
      </MapView>

      {/* ETA banner */}
      <View style={s.etaBanner}>
        <NavIcon />
        <Text style={s.etaText}>Arriving in ~4 min</Text>
        <Text style={s.plateText}>{driver?.vehicleNumber || 'UP32 BX 4417'}</Text>
      </View>

      {/* Bottom sheet */}
      <View style={s.sheet}>
        <View style={s.handle} />

        {/* OTP */}
        <View style={s.otpRow}>
          <Text style={s.otpLabel}>Start code</Text>
          <Text style={s.otp}>{ride?.otp?.split('').join('  ') || '— — — —'}</Text>
        </View>

        {/* Driver info */}
        <View style={s.driverRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{driver?.name ? driver.name.slice(0, 2).toUpperCase() : 'SK'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.driverName}>{driver?.name || 'Sunil Kumar'}</Text>
            <Text style={s.driverMeta}>★ {driver?.rating || '4.9'} · {driver?.totalRides || '2,140'} trips</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.vehicleNum}>{driver?.vehicleNumber || ''}</Text>
            <Text style={s.vehicleModel}>{driver?.vehicleModel || ''}</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={s.actionRow}>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${driver?.phone}`)} style={s.actionBtn}>
            <Text style={s.actionIcon}>📞</Text>
            <Text style={s.actionLabel}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn}>
            <Text style={s.actionIcon}>💬</Text>
            <Text style={s.actionLabel}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.actionBtnAmber]}>
            <Text style={s.actionIcon}>🛡️</Text>
            <Text style={[s.actionLabel, { color: T.AMBER_DEEP }]}>Safety</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onCancel} style={s.cancelBtn}>
          <Text style={s.cancelText}>Cancel ride</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  etaBanner: {
    position: 'absolute', top: 60, left: 16, right: 16,
    backgroundColor: T.NAVY, borderRadius: T.R_SM,
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    ...T.SHADOW_MD,
  },
  etaText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#fff' },
  plateText: { fontSize: 12, color: T.ON_NAVY_MUT },
  sheet: {
    backgroundColor: T.SURFACE, borderTopLeftRadius: T.R_XL, borderTopRightRadius: T.R_XL,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30, ...T.SHADOW_SHEET,
  },
  handle: { width: 40, height: 5, borderRadius: 99, backgroundColor: T.LINE, alignSelf: 'center', marginBottom: 16 },
  otpRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: T.R_SM, backgroundColor: T.AMBER_SOFT,
    borderWidth: 1, borderColor: T.AMBER_LINE, marginBottom: 18,
  },
  otpLabel: { fontSize: 13.5, fontWeight: '600', color: T.TEXT },
  otp: { fontSize: 22, fontWeight: '700', letterSpacing: 4, color: T.NAVY },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: T.NAVY, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '600', fontSize: 18 },
  driverName: { fontSize: 17, fontWeight: '600', color: T.TEXT },
  driverMeta: { fontSize: 13, color: T.TEXT_MUTED },
  vehicleNum: { fontSize: 14, fontWeight: '700', color: T.TEXT },
  vehicleModel: { fontSize: 12, color: T.TEXT_MUTED },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  actionBtn: {
    flex: 1, height: 58, borderRadius: T.R_SM,
    borderWidth: 1, borderColor: T.LINE, backgroundColor: T.SURFACE,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  actionBtnAmber: { backgroundColor: T.AMBER_SOFT, borderColor: T.AMBER_LINE },
  actionIcon: { fontSize: 18 },
  actionLabel: { fontSize: 11.5, fontWeight: '600', color: T.TEXT },
  cancelBtn: {
    width: '100%', height: 50, borderRadius: T.R_SM,
    borderWidth: 1, borderColor: T.LINE, backgroundColor: T.SURFACE,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: T.DANGER },
});
