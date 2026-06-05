import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { api } from '../../src/lib/api';
import { T } from '../../src/lib/theme';

const DOC_FIELDS = [
  { key: 'aadhaarFront', label: 'Aadhaar Front', hint: 'Front side of your Aadhaar card' },
  { key: 'aadhaarBack', label: 'Aadhaar Back', hint: 'Back side of your Aadhaar card' },
  { key: 'licence', label: 'Driving Licence', hint: 'Clear photo of your DL' },
  { key: 'selfie', label: 'Selfie', hint: 'Clear photo of your face' },
];

export default function KycScreen() {
  const [docs, setDocs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  async function pickImage(key: string) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setDocs({ ...docs, [key]: result.assets[0] });
  }

  async function handleSubmit() {
    if (Object.keys(docs).length < 3) {
      return Alert.alert('Upload required docs', 'Please upload Aadhaar front, licence, and selfie at minimum.');
    }
    setLoading(true);
    try {
      const formData = new FormData();
      for (const [key, asset] of Object.entries(docs)) {
        formData.append(key, { uri: asset.uri, type: 'image/jpeg', name: `${key}.jpg` } as any);
      }
      await api.post('/drivers/me/kyc/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Submitted!', 'Your KYC documents are under review. We\'ll notify you within 24 hours.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/profile') },
      ]);
    } catch {
      Alert.alert('Upload failed', 'Please check your connection and try again.');
    } finally { setLoading(false); }
  }

  const allRequired = ['aadhaarFront', 'licence', 'selfie'].every(k => docs[k]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.PAPER }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 50 }}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={T.TEXT_MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        <Text style={s.title}>KYC Verification</Text>
        <Text style={s.subtitle}>Upload clear photos of your documents. We review within 24 hours.</Text>

        {DOC_FIELDS.map(({ key, label, hint }) => {
          const uploaded = !!docs[key];
          return (
            <TouchableOpacity
              key={key}
              onPress={() => pickImage(key)}
              style={[s.docCard, uploaded && s.docCardUploaded]}
            >
              <View style={[s.docIcon, uploaded && s.docIconUploaded]}>
                <Text style={{ fontSize: 20 }}>{uploaded ? '✓' : '📄'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.docLabel, uploaded && { color: T.SUCCESS }]}>{label}</Text>
                <Text style={s.docHint}>{uploaded ? 'Uploaded — tap to replace' : hint}</Text>
              </View>
              {!uploaded && (
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 5v14M5 12l7-7 7 7" stroke={T.TEXT_FAINT} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={s.noteBox}>
          <Text style={{ fontSize: 14, marginRight: 8 }}>ℹ️</Text>
          <Text style={s.noteText}>Documents are encrypted and only used for verification. We never share them with third parties.</Text>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !allRequired}
          style={[s.ctaBtn, (!allRequired || loading) && { opacity: 0.45 }]}
        >
          <Text style={s.ctaBtnText}>{loading ? 'Uploading…' : 'Submit for Verification'}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  title: { fontSize: 24, fontWeight: '700', color: T.TEXT, letterSpacing: -0.4, marginBottom: 6 },
  subtitle: { fontSize: 14.5, color: T.TEXT_MUTED, lineHeight: 21, marginBottom: 24 },
  docCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: T.SURFACE, borderRadius: T.R_MD,
    padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: T.LINE, borderStyle: 'dashed',
    ...T.SHADOW_SM,
  },
  docCardUploaded: {
    borderStyle: 'solid', borderColor: T.SUCCESS + '60',
    backgroundColor: T.SUCCESS_SOFT,
  },
  docIcon: {
    width: 48, height: 48, borderRadius: T.R_SM,
    backgroundColor: T.SURFACE_2, alignItems: 'center', justifyContent: 'center',
  },
  docIconUploaded: { backgroundColor: '#C8EFE0' },
  docLabel: { fontSize: 15, fontWeight: '600', color: T.TEXT, marginBottom: 2 },
  docHint: { fontSize: 12.5, color: T.TEXT_MUTED },
  noteBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: T.SURFACE_2, borderRadius: T.R_SM,
    padding: 14, marginBottom: 24, borderWidth: 1, borderColor: T.LINE,
  },
  noteText: { flex: 1, fontSize: 13, color: T.TEXT_MUTED, lineHeight: 19 },
  ctaBtn: {
    height: 56, backgroundColor: T.AMBER, borderRadius: T.R_MD,
    alignItems: 'center', justifyContent: 'center', ...T.SHADOW_AMBER,
  },
  ctaBtnText: { fontSize: 17, fontWeight: '600', color: T.ON_AMBER },
});
