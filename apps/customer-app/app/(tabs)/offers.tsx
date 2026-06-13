import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Svg, { Path } from 'react-native-svg';
import { api } from '../../src/lib/api';
import { T } from '../../src/lib/theme';

interface Offer {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: number;
  discountType: 'FLAT' | 'PERCENT';
  minFare: number;
  maxDiscount: number;
  validUntil: string;
  usesLeft: number | null;
}

function CopyIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2 M14 2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2" stroke={T.NAVY} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const STATIC_OFFERS: Offer[] = [
  {
    id: 'WELCOME10',
    code: 'WELCOME10',
    title: 'Welcome Offer',
    description: '10% off your first 3 rides with Transit. No minimum fare.',
    discount: 10,
    discountType: 'PERCENT',
    minFare: 0,
    maxDiscount: 50,
    validUntil: '2026-09-30T23:59:59Z',
    usesLeft: null,
  },
  {
    id: 'FLAT30',
    code: 'FLAT30',
    title: '₹30 Off',
    description: 'Get ₹30 off on rides above ₹150. Valid all week.',
    discount: 30,
    discountType: 'FLAT',
    minFare: 150,
    maxDiscount: 30,
    validUntil: '2026-06-30T23:59:59Z',
    usesLeft: 500,
  },
  {
    id: 'MIDNIGHT20',
    code: 'MIDNIGHT20',
    title: 'Night Rider',
    description: '20% off on rides booked between 11 PM – 4 AM.',
    discount: 20,
    discountType: 'PERCENT',
    minFare: 100,
    maxDiscount: 60,
    validUntil: '2026-07-31T23:59:59Z',
    usesLeft: null,
  },
];

function daysLeft(dateStr: string) {
  const d = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (d <= 0) return 'Expired';
  if (d === 1) return 'Expires today';
  if (d <= 7) return `${d} days left`;
  return `Valid till ${new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}

export default function OffersScreen() {
  const [couponInput, setCouponInput] = useState('');

  const { data: apiOffers } = useQuery<Offer[]>({
    queryKey: ['offers'],
    queryFn: () => api.get('/offers').then(r => r.data.data || []).catch(() => []),
  });

  const offers: Offer[] = (apiOffers && apiOffers.length > 0) ? apiOffers : STATIC_OFFERS;

  async function applyCode() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    try {
      await api.post('/offers/validate', { code });
      Alert.alert('Coupon saved!', `${code} will be applied on your next ride.`);
      setCouponInput('');
    } catch (e: any) {
      Alert.alert('Invalid code', e.response?.data?.error || 'This code is not valid or has expired.');
    }
  }

  function copyCode(code: string) {
    Clipboard.setString(code);
    Alert.alert('Copied!', `${code} copied to clipboard.`);
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={s.header}>
          <Text style={s.title}>Offers & Coupons</Text>
          <Text style={s.subtitle}>Savings on every ride</Text>
        </View>

        {/* Coupon entry */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={s.couponRow}>
            <TextInput
              value={couponInput}
              onChangeText={setCouponInput}
              placeholder="Enter coupon code"
              placeholderTextColor={T.TEXT_FAINT}
              style={s.couponInput}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={applyCode}
            />
            <TouchableOpacity onPress={applyCode} style={s.applyBtn}>
              <Text style={s.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.sectionTitle}>Available Offers</Text>

        {offers.map(offer => {
          const expired = new Date(offer.validUntil) < new Date();
          return (
            <View key={offer.id} style={[s.offerCard, expired && s.offerExpired]}>
              <View style={s.offerLeft}>
                <View style={s.discountBadge}>
                  <Text style={s.discountText}>
                    {offer.discountType === 'FLAT' ? `₹${offer.discount}` : `${offer.discount}%`}
                  </Text>
                  <Text style={s.discountOff}>OFF</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.offerTitle}>{offer.title}</Text>
                <Text style={s.offerDesc}>{offer.description}</Text>
                {offer.minFare > 0 && (
                  <Text style={s.offerMeta}>Min. fare ₹{offer.minFare} · Max discount ₹{offer.maxDiscount}</Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <TouchableOpacity onPress={() => copyCode(offer.code)} style={s.codeChip}>
                    <Text style={s.codeText}>{offer.code}</Text>
                    <CopyIcon />
                  </TouchableOpacity>
                  <Text style={[s.validity, expired && { color: T.DANGER }]}>{daysLeft(offer.validUntil)}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.PAPER },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '600', color: T.TEXT, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: T.TEXT_MUTED, marginTop: 2, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', letterSpacing: 1, color: T.TEXT_FAINT, textTransform: 'uppercase', marginBottom: 12, paddingHorizontal: 20 },
  couponRow: {
    flexDirection: 'row', gap: 10,
    backgroundColor: T.SURFACE, borderRadius: T.R_MD,
    borderWidth: 1, borderColor: T.LINE, overflow: 'hidden', ...T.SHADOW_SM,
  },
  couponInput: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontWeight: '600', color: T.TEXT, letterSpacing: 1.5,
  },
  applyBtn: {
    paddingHorizontal: 20, backgroundColor: T.NAVY,
    alignItems: 'center', justifyContent: 'center',
  },
  applyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  offerCard: {
    flexDirection: 'row', gap: 16,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: T.SURFACE, borderRadius: T.R_MD,
    padding: 16, borderWidth: 1, borderColor: T.LINE, ...T.SHADOW_SM,
  },
  offerExpired: { opacity: 0.5 },
  offerLeft: { alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 },
  discountBadge: {
    width: 64, height: 64, borderRadius: T.R_SM,
    backgroundColor: T.AMBER_SOFT, borderWidth: 1.5, borderColor: T.AMBER_LINE,
    alignItems: 'center', justifyContent: 'center',
  },
  discountText: { fontSize: 18, fontWeight: '800', color: T.AMBER_DEEP, lineHeight: 20 },
  discountOff: { fontSize: 10, fontWeight: '700', color: T.AMBER_DEEP, letterSpacing: 0.5 },
  offerTitle: { fontSize: 15, fontWeight: '700', color: T.TEXT, marginBottom: 4 },
  offerDesc: { fontSize: 13, color: T.TEXT_MUTED, lineHeight: 18 },
  offerMeta: { fontSize: 12, color: T.TEXT_FAINT, marginTop: 4 },
  codeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: T.SURFACE_2, borderRadius: T.R_SM,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderStyle: 'dashed', borderColor: T.NAVY + '60',
  },
  codeText: { fontSize: 13, fontWeight: '700', color: T.NAVY, letterSpacing: 1 },
  validity: { fontSize: 12, color: T.TEXT_FAINT },
});
