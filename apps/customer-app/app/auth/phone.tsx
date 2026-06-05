import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import { api } from '../../src/lib/api';
import { T } from '../../src/lib/theme';

function TransitWordmark() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      {/* T glyph */}
      <Svg width={36} height={36} viewBox="0 0 36 36">
        <Rect x={4} y={6} width={28} height={7} rx={3.5} fill={T.AMBER} />
        <Path d="M14 13 L14 28 Q14 31 18 31 Q22 31 22 28 L22 13" fill={T.AMBER} />
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
