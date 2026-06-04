import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { api } from '../../src/lib/api';

const DOC_FIELDS = [
  { key: 'aadhaarFront', label: 'Aadhaar Front' },
  { key: 'aadhaarBack', label: 'Aadhaar Back' },
  { key: 'licence', label: 'Driving Licence' },
  { key: 'selfie', label: 'Selfie' },
];

export default function KycScreen() {
  const [docs, setDocs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  async function pickImage(key: string) {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setDocs({ ...docs, [key]: result.assets[0] });
  }

  async function handleSubmit() {
    if (Object.keys(docs).length < 3) return Alert.alert('Please upload at least Aadhaar front, licence, and selfie');
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
      Alert.alert('Error', 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-gray-900 mb-2 mt-8">KYC Verification</Text>
      <Text className="text-gray-500 mb-8">Upload clear photos of your documents for verification</Text>
      {DOC_FIELDS.map(({ key, label }) => (
        <TouchableOpacity key={key} onPress={() => pickImage(key)} className={`border-2 rounded-2xl p-5 mb-4 items-center ${docs[key] ? 'border-green-400 bg-green-50' : 'border-dashed border-gray-200 bg-gray-50'}`}>
          <Text className={`font-medium ${docs[key] ? 'text-green-700' : 'text-gray-600'}`}>{docs[key] ? '✓ ' : '+ '}{label}</Text>
          {docs[key] && <Text className="text-xs text-green-500 mt-1">Uploaded</Text>}
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={handleSubmit} disabled={loading} className="bg-blue-600 rounded-2xl py-4 items-center mt-4">
        <Text className="text-white font-semibold text-base">{loading ? 'Uploading...' : 'Submit KYC'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
