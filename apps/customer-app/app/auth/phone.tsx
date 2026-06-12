import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { api } from '../../src/lib/api';
import { T } from '../../src/lib/theme';

function TransitWordmark() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <Svg width={40} height={40} viewBox="0 0 120 120">
        <Defs>
          <LinearGradient id="wmbg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#16356A" />
            <Stop offset="1" stopColor="#0A1C40" />
          </LinearGradient>
        </Defs>
        <Rect x="6" y="6" width="108" height="108" rx="28" fill="url(#wmbg)" />
        <Rect x="32" y="33" width="56" height="13.5" rx="6.75" fill="#F7B32B" />
        <Path d="M53 44 L67 44 L67 70 L78 86 L70 90 L60 80 L50 90 L42 86 L53 70 Z" fill="#F7B32B" />
      </Svg>
      <Text style={{ fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.5 }}>Transit</Text>
    </View>
  );
}

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    if (phone.length < 10) return Alert.alert('Enter a valid 10-digit number');
    setLoading(true);
    try {
      await api.post('/auth/user/send-otp', { phone });
      router.push({ pathname: '/auth/otp', params: { phone } });
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to send OTP');
    } finally { setLoading(false); }
  }

  const ready = phone.length === 10;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <SafeAreaView style={s.container}>
        <View style={s.inner}>
          <TransitWordmark />
          <Text style={s.tagline}>Ride. Upfront fares. No surprises.</Text>

          <View style={s.card}>
            <Text style={s.cardTitle}>Your mobile number</Text>
            <View style={s.inputRow}>
              <View style={s.dialCode}>
                <Text style={s.dialCodeText}>+91</Text>
              </View>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit number"
                placeholderTextColor={T.TEXT_FAINT}
                keyboardType="phone-pad"
                maxLength={10}
                style={s.input}
                autoFocus
              />
            </View>
            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={loading || !ready}
              style={[s.ctaBtn, (!ready || loading) && { opacity: 0.45 }]}
            >
              <Text style={s.ctaBtnText}>{loading ? 'Sending OTP…' : 'Continue'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.terms}>By continuing, you agree to our Terms & Privacy Policy</Text>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.NAVY },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  tagline: { fontSize: 16, color: T.ON_NAVY_MUT, marginBottom: 36, letterSpacing: 0.1 },
  card: {
    backgroundColor: T.SURFACE, borderRadius: T.R_XL,
    padding: 24, ...T.SHADOW_LG,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', letterSpacing: 1, color: T.TEXT_FAINT, textTransform: 'uppercase', marginBottom: 12 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: T.LINE, borderRadius: T.R_MD,
    backgroundColor: T.SURFACE_2, marginBottom: 16, overflow: 'hidden',
  },
  dialCode: {
    paddingHorizontal: 16, paddingVertical: 16,
    borderRightWidth: 1, borderRightColor: T.LINE,
  },
  dialCodeText: { fontSize: 16, fontWeight: '600', color: T.TEXT },
  input: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 16,
    fontSize: 20, fontWeight: '600', color: T.TEXT, letterSpacing: 2,
  },
  ctaBtn: {
    height: 56, backgroundColor: T.AMBER, borderRadius: T.R_MD,
    alignItems: 'center', justifyContent: 'center', ...T.SHADOW_AMBER,
  },
  ctaBtnText: { fontSize: 17, fontWeight: '600', color: T.ON_AMBER },
  terms: { textAlign: 'center', fontSize: 12, color: T.ON_NAVY_MUT, marginTop: 24, lineHeight: 18 },
});
