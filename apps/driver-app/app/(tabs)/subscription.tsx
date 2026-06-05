import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import Svg, { Path } from 'react-native-svg';
import { api } from '../../src/lib/api';
import { T } from '../../src/lib/theme';
import RazorpayCheckout from 'react-native-razorpay';

const FEATURES = [
  'Zero commission on every ride',
  'Priority dispatch during peak hours',
  'Instant payouts to your bank',
  'In-app emergency SOS support',
  'Weekly earnings insights',
];

function CheckIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5l4.5 4.5L19 7" stroke={T.AMBER} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function SubscriptionScreen() {
  const { data, refetch } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.get('/drivers/me/subscription').then(r => r.data.data),
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { data: orderData } = await api.post('/drivers/me/subscription', { planId });
      const { razorpayOrderId, amount } = orderData.data;
      return new Promise((resolve, reject) => {
        RazorpayCheckout.open({
          key: process.env.EXPO_PUBLIC_RAZORPAY_KEY || '',
          order_id: razorpayOrderId,
          amount: amount * 100,
          currency: 'INR',
          name: 'Transit',
          description: 'Driver Subscription',
          prefill: { contact: '' },
        }).then((paymentData: any) => {
          return api.post('/drivers/me/subscription/confirm', { planId, ...paymentData });
        }).then(resolve).catch(reject);
      });
    },
    onSuccess: () => { Alert.alert('Subscribed!', 'Your plan is now active.'); refetch(); },
    onError: () => Alert.alert('Payment failed', 'Please try again.'),
  });

  const active = data?.currentSubscription;
  const plans: any[] = data?.availablePlans || [
    { id: 'weekly', name: 'Weekly', billingCycle: 'WEEKLY', basePrice: 99 },
    { id: 'monthly', name: 'Monthly', billingCycle: 'MONTHLY', basePrice: 299 },
  ];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={s.header}>
          <Text style={s.title}>Driver Plan</Text>
          <Text style={s.subtitle}>Flat fee. Zero commission.</Text>
        </View>

        {/* Active plan banner */}
        {active && (
          <View style={s.activeBanner}>
            <View style={s.activeDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.activeTitle}>{active.plan?.name} · Active</Text>
              <Text style={s.activeSub}>Renews {new Date(active.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
            </View>
          </View>
        )}

        {/* Plan cards */}
        <View style={{ paddingHorizontal: 20, gap: 12, marginBottom: 24 }}>
          {plans.map((plan: any) => {
            const isMonthly = plan.billingCycle === 'MONTHLY';
            const period = isMonthly ? 'month' : 'week';
            const savings = isMonthly ? 'Best value' : null;
            return (
              <View key={plan.id} style={[s.planCard, isMonthly && s.planCardFeatured]}>
                <View style={s.planCardTop}>
                  <View>
                    <Text style={[s.planName, isMonthly && { color: '#fff' }]}>{plan.name}</Text>
                    {savings && (
                      <View style={s.savingsBadge}>
                        <Text style={s.savingsBadgeText}>Best value</Text>
                      </View>
                    )}
                  </View>
                  <View>
                    <Text style={[s.planPrice, isMonthly && { color: '#fff' }]}>₹{plan.basePrice}</Text>
                    <Text style={[s.planPeriod, isMonthly && { color: T.ON_NAVY_MUT }]}>/{period}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => !active && subscribeMutation.mutate(plan.id)}
                  disabled={subscribeMutation.isPending || !!active}
                  style={[s.planBtn, isMonthly ? s.planBtnAmber : s.planBtnOutline, !!active && { opacity: 0.5 }]}
                >
                  <Text style={[s.planBtnText, !isMonthly && { color: T.NAVY }]}>
                    {active ? 'Active plan' : 'Start free trial'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Trial callout */}
        {!active && (
          <View style={s.trialCallout}>
            <Text style={{ fontSize: 22, marginBottom: 6 }}>🎁</Text>
            <Text style={s.trialTitle}>3 months free</Text>
            <Text style={s.trialSub}>No card needed. Cancel anytime before the trial ends.</Text>
          </View>
        )}

        {/* Features list */}
        <View style={s.featuresCard}>
          <Text style={s.featuresTitle}>Everything included</Text>
          {FEATURES.map(f => (
            <View key={f} style={s.featureRow}>
              <CheckIcon />
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.PAPER },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: T.TEXT, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, color: T.TEXT_MUTED, marginTop: 2 },
  activeBanner: {
    marginHorizontal: 20, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.SUCCESS_SOFT, borderRadius: T.R_MD,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: T.SUCCESS + '40',
  },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.SUCCESS },
  activeTitle: { fontSize: 15, fontWeight: '600', color: T.SUCCESS },
  activeSub: { fontSize: 13, color: T.TEXT_MUTED, marginTop: 1 },
  planCard: {
    backgroundColor: T.SURFACE, borderRadius: T.R_LG,
    padding: 22, borderWidth: 1, borderColor: T.LINE, ...T.SHADOW_SM,
  },
  planCardFeatured: {
    backgroundColor: T.NAVY, borderColor: T.NAVY,
    ...T.SHADOW_MD,
  },
  planCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 },
  planName: { fontSize: 17, fontWeight: '600', color: T.TEXT, marginBottom: 6 },
  savingsBadge: {
    backgroundColor: T.AMBER_SOFT, borderRadius: T.R_PILL,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: T.AMBER_LINE,
  },
  savingsBadgeText: { fontSize: 11, fontWeight: '700', color: T.AMBER_DEEP, letterSpacing: 0.4 },
  planPrice: { fontSize: 36, fontWeight: '700', color: T.TEXT, letterSpacing: -1, textAlign: 'right' },
  planPeriod: { fontSize: 14, color: T.TEXT_MUTED, textAlign: 'right' },
  planBtn: {
    height: 50, borderRadius: T.R_MD,
    alignItems: 'center', justifyContent: 'center',
  },
  planBtnAmber: { backgroundColor: T.AMBER, ...T.SHADOW_AMBER },
  planBtnOutline: { borderWidth: 1.5, borderColor: T.NAVY },
  planBtnText: { fontSize: 16, fontWeight: '600', color: T.ON_AMBER },
  trialCallout: {
    marginHorizontal: 20, marginBottom: 20,
    borderRadius: T.R_MD, borderWidth: 1, borderColor: T.AMBER_LINE,
    backgroundColor: T.AMBER_SOFT, padding: 20, alignItems: 'center',
  },
  trialTitle: { fontSize: 20, fontWeight: '700', color: T.TEXT, marginBottom: 4 },
  trialSub: { fontSize: 14, color: T.TEXT_MUTED, textAlign: 'center' },
  featuresCard: {
    marginHorizontal: 20, backgroundColor: T.SURFACE,
    borderRadius: T.R_MD, padding: 18,
    borderWidth: 1, borderColor: T.LINE, ...T.SHADOW_SM,
  },
  featuresTitle: { fontSize: 13, fontWeight: '600', letterSpacing: 1, color: T.TEXT_FAINT, textTransform: 'uppercase', marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  featureText: { fontSize: 15, color: T.TEXT, fontWeight: '500', flex: 1 },
});
