import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/auth';
import { T } from '../../src/lib/theme';

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const refs = useRef<TextInput[]>([]);
  const { setAuth } = useAuthStore();

  async function handleVerify() {
    const code = otp.join('');
    if (code.length < 6) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/driver/verify-otp', { phone, otp: code });
      if (!data.data.registered) {
        router.replace({ pathname: '/auth/register', params: { phone } });
        return;
      }
      await setAuth(data.data.accessToken, data.data.driver);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Invalid OTP', e.response?.data?.error || 'Please check the code and try again.');
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally { setLoading(false); }
  }

  function handleChange(val: string, idx: number) {
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
    if (next.join('').length === 6) setTimeout(() => handleVerify(), 100);
  }

  function handleBack(idx: number) {
    if (!otp[idx] && idx > 0) refs.current[idx - 1]?.focus();
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.inner}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={T.ON_NAVY} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        <Text style={s.title}>Verify your number</Text>
        <Text style={s.subtitle}>6-digit code sent to +91 {phone}</Text>

        <View style={s.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={r => { if (r) refs.current[i] = r; }}
              value={digit}
              onChangeText={v => handleChange(v, i)}
              onKeyPress={({ nativeEvent }) => nativeEvent.key === 'Backspace' && handleBack(i)}
              keyboardType="number-pad"
              maxLength={1}
              style={[s.otpBox, digit && s.otpBoxFilled]}
              autoFocus={i === 0}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleVerify}
          disabled={loading || otp.join('').length < 6}
          style={[s.ctaBtn, (loading || otp.join('').length < 6) && { opacity: 0.45 }]}
        >
          <Text style={s.ctaBtnText}>{loading ? 'Verifying…' : 'Verify & Continue'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 20, alignSelf: 'center' }}>
          <Text style={{ fontSize: 14, color: T.ON_NAVY_MUT }}>Didn't receive it? <Text style={{ color: T.AMBER, fontWeight: '600' }}>Resend</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.NAVY },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 8, justifyContent: 'center' },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 15, color: T.ON_NAVY_MUT, marginBottom: 36 },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 32, justifyContent: 'center' },
  otpBox: {
    width: 48, height: 56, borderRadius: T.R_SM,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#fff',
  },
  otpBoxFilled: {
    borderColor: T.AMBER, backgroundColor: T.AMBER_SOFT,
    color: T.AMBER,
  },
  ctaBtn: {
    height: 56, backgroundColor: T.AMBER, borderRadius: T.R_MD,
    alignItems: 'center', justifyContent: 'center', ...T.SHADOW_AMBER,
  },
  ctaBtnText: { fontSize: 17, fontWeight: '600', color: T.ON_AMBER },
});
