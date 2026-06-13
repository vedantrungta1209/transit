import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import Svg, { Path } from 'react-native-svg';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/auth';
import { T } from '../../src/lib/theme';

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  opts?: object;
}

function Field({ label, value, onChangeText, opts }: FieldProps) {
  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={s.fieldInput}
        placeholderTextColor={T.TEXT_FAINT}
        {...opts}
      />
    </View>
  );
}

export default function RegisterScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    name: '', vehicleType: 'AUTO', vehicleNumber: '', vehicleModel: '',
    vehicleYear: '', licenceNumber: '', city: 'Bangalore', aadhaarNumber: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((field: keyof typeof form, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  }, []);

  async function handleRegister() {
    if (!form.name || !form.vehicleNumber || !form.licenceNumber) {
      return Alert.alert('Required fields', 'Please fill name, vehicle number, and licence number.');
    }
    setLoading(true);
    try {
      const { data } = await api.post('/drivers/register', { ...form, phone });
      await setAuth(data.data.accessToken, data.data.driver);
      router.replace('/auth/kyc');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.PAPER }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 50 }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M15 18l-6-6 6-6" stroke={T.TEXT_MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          <Text style={s.title}>Create Driver Account</Text>
          <Text style={s.subtitle}>+91 {phone}</Text>

          <View style={s.card}>
            <Field
              label="Full Name *"
              value={form.name}
              onChangeText={v => handleChange('name', v)}
              opts={{ placeholder: 'As on your licence' }}
            />
            <Field
              label="Vehicle Number *"
              value={form.vehicleNumber}
              onChangeText={v => handleChange('vehicleNumber', v)}
              opts={{ placeholder: 'e.g. KA01AB1234', autoCapitalize: 'characters' }}
            />
            <Field
              label="Vehicle Model"
              value={form.vehicleModel}
              onChangeText={v => handleChange('vehicleModel', v)}
              opts={{ placeholder: 'e.g. Maruti Swift' }}
            />
            <Field
              label="Vehicle Year"
              value={form.vehicleYear}
              onChangeText={v => handleChange('vehicleYear', v)}
              opts={{ placeholder: '2020', keyboardType: 'number-pad' }}
            />
            <Field
              label="Licence Number *"
              value={form.licenceNumber}
              onChangeText={v => handleChange('licenceNumber', v)}
              opts={{ autoCapitalize: 'characters' }}
            />
            <Field
              label="Aadhaar Number"
              value={form.aadhaarNumber}
              onChangeText={v => handleChange('aadhaarNumber', v)}
              opts={{ placeholder: '12-digit number', keyboardType: 'number-pad', maxLength: 12 }}
            />

            <Text style={s.fieldLabel}>Vehicle Type</Text>
            <View style={[s.fieldInput, { padding: 0, marginBottom: 0 }]}>
              <Picker
                selectedValue={form.vehicleType}
                onValueChange={v => handleChange('vehicleType', v)}
                style={{ color: T.TEXT }}
                dropdownIconColor={T.TEXT_MUTED}
              >
                {[['AUTO', '🛺 Auto'], ['CAB', '🚗 Cab'], ['EV_CAB', '⚡ EV Cab'], ['BIKE', '🏍 Bike']].map(([v, l]) => (
                  <Picker.Item key={v} label={l} value={v} />
                ))}
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            style={[s.ctaBtn, loading && { opacity: 0.5 }]}
          >
            <Text style={s.ctaBtnText}>{loading ? 'Creating Account…' : 'Create Account'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: T.SURFACE, borderWidth: 1, borderColor: T.LINE,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    ...T.SHADOW_SM,
  },
  title: { fontSize: 24, fontWeight: '700', color: T.TEXT, letterSpacing: -0.4, marginBottom: 4 },
  subtitle: { fontSize: 14, color: T.TEXT_MUTED, marginBottom: 24 },
  card: {
    backgroundColor: T.SURFACE, borderRadius: T.R_LG,
    padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: T.LINE, ...T.SHADOW_SM,
  },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.8, color: T.TEXT_FAINT, textTransform: 'uppercase', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1.5, borderColor: T.LINE, borderRadius: T.R_SM,
    backgroundColor: T.SURFACE_2, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: T.TEXT,
  },
  ctaBtn: {
    height: 56, backgroundColor: T.AMBER, borderRadius: T.R_MD,
    alignItems: 'center', justifyContent: 'center', ...T.SHADOW_AMBER,
  },
  ctaBtnText: { fontSize: 17, fontWeight: '600', color: T.ON_AMBER },
});
