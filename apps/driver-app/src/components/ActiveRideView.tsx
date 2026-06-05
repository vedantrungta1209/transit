import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { api } from '../lib/api';
import { T } from '../lib/theme';

interface Props { ride: any; onUpdate: (r: any) => void; }

const STEPS = { DRIVER_ASSIGNED: 0, DRIVER_ARRIVING: 1, IN_PROGRESS: 2, COMPLETED: 3 };

export default function ActiveRideView({ ride, onUpdate }: Props) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const step = STEPS[ride.status as keyof typeof STEPS] ?? 0;

  async function arrive() {
    setLoading(true);
    try {
      const { data } = await api.patch(`/rides/${ride.id}/arrive`);
      onUpdate(data.data);
    } finally { setLoading(false); }
  }

  async function startRide() {
    if (otp.length !== 4) return Alert.alert('Enter 4-digit OTP from customer');
    setLoading(true);
    try {
      const { data } = await api.patch(`/rides/${ride.id}/start`, { otp });
      onUpdate(data.data);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Invalid OTP');
    } finally { setLoading(false); }
  }

  async function completeRide() {
    Alert.alert('Complete Ride', 'Have you reached the destination?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: async () => {
        setLoading(true);
        try {
          const { data } = await api.patch(`/rides/${ride.id}/complete`);
          Alert.alert('Ride Complete!', `Fare: ₹${data.data.actualFare}`);
          onUpdate(null);
        } finally { setLoading(false); }
      }},
    ]);
  }

  const stepLabel = [
    'Head to Pickup',
    'Arrived at Pickup',
    'Ride in Progress',
    'Ride Completed',
  ][step];

  const stepSub = [
    ride.pickupAddress,
    'Enter the OTP from the customer',
    `Heading to ${ride.dropAddress}`,
    '',
  ][step];

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

      {/* Nav header */}
      <View style={s.navHeader}>
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <Path d="M3 11l18-8-8 18-2-7z" stroke={T.AMBER} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <View style={{ flex: 1 }}>
          <Text style={s.navTitle}>{stepLabel}</Text>
          <Text style={s.navSub} numberOfLines={1}>{stepSub}</Text>
        </View>
      </View>

      {/* Rider info */}
      <View style={s.riderRow}>
        <View style={s.riderAvatar}>
          <Text style={s.riderInitials}>{ride.customerName ? ride.customerName.slice(0, 2).toUpperCase() : 'RV'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.riderName}>{ride.customerName || 'Rider'}</Text>
          <Text style={s.riderMeta}>★ 4.8 · {ride.pickupAddress?.split(',')[0]}</Text>
        </View>
        <TouchableOpacity style={s.riderAction}>
          <Text style={{ fontSize: 18 }}>📞</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.riderAction}>
          <Text style={{ fontSize: 18 }}>💬</Text>
        </TouchableOpacity>
      </View>

      {/* Step-specific action */}
      {step === 0 && (
        <TouchableOpacity onPress={arrive} disabled={loading} style={s.amberBtn}>
          <Text style={s.amberBtnText}>Slide when you arrive</Text>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M9 5l7 7-7 7" stroke={T.ON_AMBER} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
      )}

      {step === 1 && (
        <View>
          <View style={s.otpField}>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter 4-digit OTP"
              placeholderTextColor={T.TEXT_FAINT}
              keyboardType="number-pad"
              maxLength={4}
              style={s.otpInput}
            />
          </View>
          <TouchableOpacity onPress={startRide} disabled={loading || otp.length !== 4} style={[s.amberBtn, (loading || otp.length !== 4) && { opacity: 0.5 }]}>
            <Text style={s.amberBtnText}>Start Ride</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <TouchableOpacity onPress={completeRide} disabled={loading} style={s.amberBtn}>
          <Text style={s.amberBtnText}>Complete Ride</Text>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12.5l4.5 4.5L19 7" stroke={T.ON_AMBER} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: T.SURFACE, borderTopLeftRadius: T.R_XL, borderTopRightRadius: T.R_XL,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30, ...T.SHADOW_SHEET,
  },
  handle: { width: 40, height: 5, borderRadius: 99, backgroundColor: T.LINE, alignSelf: 'center', marginBottom: 14 },
  navHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: T.NAVY, borderRadius: T.R_MD,
    paddingHorizontal: 18, paddingVertical: 14, marginBottom: 16,
    ...T.SHADOW_MD,
  },
  navTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  navSub: { fontSize: 13, color: T.ON_NAVY_MUT, marginTop: 1 },
  riderRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  riderAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: T.NAVY, alignItems: 'center', justifyContent: 'center' },
  riderInitials: { color: '#fff', fontWeight: '600', fontSize: 17 },
  riderName: { fontSize: 17, fontWeight: '600', color: T.TEXT },
  riderMeta: { fontSize: 13, color: T.TEXT_MUTED },
  riderAction: {
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 1, borderColor: T.LINE, backgroundColor: T.SURFACE,
    alignItems: 'center', justifyContent: 'center',
  },
  amberBtn: {
    width: '100%', height: 56, borderRadius: T.R_MD,
    backgroundColor: T.AMBER, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, ...T.SHADOW_AMBER,
  },
  amberBtnText: { fontSize: 17, fontWeight: '600', color: T.ON_AMBER },
  otpField: {
    borderWidth: 1, borderColor: T.AMBER_LINE, borderRadius: T.R_SM,
    backgroundColor: T.AMBER_SOFT, marginBottom: 12,
  },
  otpInput: {
    height: 52, textAlign: 'center', fontSize: 26,
    fontWeight: '700', letterSpacing: 10, color: T.NAVY,
    paddingHorizontal: 16,
  },
});
