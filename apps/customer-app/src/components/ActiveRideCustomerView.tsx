import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Svg, { Path } from 'react-native-svg';
import { T } from '../lib/theme';

interface Props { ride: any; driver: any; driverLocation: any; }

export default function ActiveRideCustomerView({ ride, driver, driverLocation }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: driverLocation?.lat || 12.9716,
          longitude: driverLocation?.lng || 77.5946,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {driverLocation && <Marker coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }} />}
        {ride?.dropLat && <Marker coordinate={{ latitude: ride.dropLat, longitude: ride.dropLng }} pinColor={T.AMBER} />}
      </MapView>

      {/* Status banner */}
      <View style={s.navBanner}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M3 11l18-8-8 18-2-7z" stroke={T.AMBER} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <Text style={s.navText}>Heading to your destination</Text>
      </View>

      {/* Bottom sheet */}
      <View style={s.sheet}>
        <View style={s.handle} />

        <Text style={s.title}>Ride in Progress</Text>
        <Text style={s.sub}>Heading to {ride?.dropAddress || 'destination'}</Text>

        {/* OTP display */}
        <View style={s.otpBox}>
          <Text style={s.otpHint}>Share your OTP with driver to start</Text>
          <Text style={s.otpCode}>{ride?.otp?.split('').join('  ') || '— — — —'}</Text>
        </View>

        {/* SOS */}
        <TouchableOpacity
          onPress={() =>
            Alert.alert('SOS Emergency', 'Emergency services will be contacted. Continue?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Call 112', style: 'destructive', onPress: () => {} },
            ])
          }
          style={s.sosBtn}
        >
          <Text style={{ fontSize: 16 }}>⚠️</Text>
          <Text style={s.sosBtnText}>SOS Emergency</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  navBanner: {
    position: 'absolute', top: 60, left: 16, right: 16,
    backgroundColor: T.NAVY, borderRadius: T.R_SM,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    ...T.SHADOW_MD,
  },
  navText: { fontSize: 14, fontWeight: '600', color: '#fff', flex: 1 },
  sheet: {
    backgroundColor: T.SURFACE, borderTopLeftRadius: T.R_XL, borderTopRightRadius: T.R_XL,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30, ...T.SHADOW_SHEET,
  },
  handle: { width: 40, height: 5, borderRadius: 99, backgroundColor: T.LINE, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', color: T.TEXT, marginBottom: 4 },
  sub: { fontSize: 13.5, color: T.TEXT_MUTED, marginBottom: 18 },
  otpBox: {
    borderRadius: T.R_SM, backgroundColor: T.AMBER_SOFT,
    borderWidth: 1, borderColor: T.AMBER_LINE,
    paddingVertical: 16, alignItems: 'center', marginBottom: 16,
  },
  otpHint: { fontSize: 12.5, color: T.TEXT_MUTED, marginBottom: 6 },
  otpCode: { fontSize: 26, fontWeight: '700', letterSpacing: 6, color: T.NAVY },
  sosBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: T.DANGER, borderRadius: T.R_SM, paddingVertical: 14,
  },
  sosBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
