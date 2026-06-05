import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Svg, { Path, Rect } from 'react-native-svg';
import { api } from '../../src/lib/api';
import { T } from '../../src/lib/theme';

function money(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

const MOCK_WEEK = [620, 980, 1284, 740, 1510, 1880, 1284];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function EarningsScreen() {
  const { data } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => api.get('/drivers/me/earnings').then(r => r.data.data),
  });

  const todayEarnings = data?.today ?? 1284;
  const weekEarnings = data?.thisWeek ?? 8298;
  const rides = data?.rides ?? [];
  const maxWeek = Math.max(...MOCK_WEEK);

  const breakdown = [
    { label: 'Trip fares', value: data?.tripFares ?? 7620, icon: '🛺' },
    { label: 'Tips', value: data?.tips ?? 340, icon: '★' },
    { label: 'Incentive · 50 trips', value: data?.incentives ?? 500, icon: '🎁' },
    { label: 'Subscription', value: -(data?.subscription ?? 162), icon: '%' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.header}>
          <Text style={s.title}>Earnings</Text>
        </View>

        {/* Weekly card */}
        <View style={s.weekCard}>
          <Text style={s.weekLabel}>This week</Text>
          <Text style={s.weekAmount}>{money(weekEarnings)}</Text>
          <View style={s.weekBadge}>
            <Text style={{ fontSize: 12, marginRight: 4 }}>✓</Text>
            <Text style={s.weekBadgeText}>Zero commission — every rupee is yours</Text>
          </View>

          {/* Bar chart */}
          <View style={s.chart}>
            {MOCK_WEEK.map((v, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <View style={[s.bar, {
                  height: (v / maxWeek) * 60,
                  backgroundColor: i === 5 ? T.AMBER : 'rgba(255,255,255,0.22)',
                }]} />
                <Text style={s.dayLabel}>{DAYS[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Breakdown */}
        <View style={[s.card, { marginBottom: 16 }]}>
          {breakdown.map((item, k) => (
            <View key={item.label} style={[s.breakdownRow, k > 0 && { borderTopWidth: 1, borderTopColor: T.LINE }]}>
              <View style={s.breakdownIcon}>
                <Text style={{ fontSize: 17 }}>{item.icon}</Text>
              </View>
              <Text style={s.breakdownLabel}>{item.label}</Text>
              <Text style={[s.breakdownValue, item.value < 0 && { color: T.TEXT_MUTED }]}>
                {item.value < 0 ? '–' + money(-item.value) : money(item.value)}
              </Text>
            </View>
          ))}
        </View>

        {/* Transfer button */}
        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity style={s.transferBtn}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>💸</Text>
            <Text style={s.transferBtnText}>Transfer to bank</Text>
          </TouchableOpacity>
        </View>

        {/* Recent rides */}
        {rides.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <Text style={s.sectionTitle}>Recent rides</Text>
            {rides.map((ride: any) => (
              <View key={ride.id} style={[s.card, { marginBottom: 10 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: T.TEXT }} numberOfLines={1}>{ride.dropAddress}</Text>
                    <Text style={{ fontSize: 12, color: T.TEXT_FAINT, marginTop: 2 }}>
                      {new Date(ride.createdAt).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: T.SUCCESS }}>₹{ride.actualFare}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.PAPER },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '600', color: T.TEXT, letterSpacing: -0.4 },
  weekCard: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: T.NAVY, borderRadius: T.R_LG,
    padding: 22, overflow: 'hidden',
    ...T.SHADOW_MD,
  },
  weekLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.4, color: T.ON_NAVY_MUT, textTransform: 'uppercase', marginBottom: 4 },
  weekAmount: { fontSize: 42, fontWeight: '700', letterSpacing: -1, color: '#fff', lineHeight: 46, marginBottom: 8 },
  weekBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  weekBadgeText: { fontSize: 13, fontWeight: '600', color: T.AMBER },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80 },
  bar: { width: '100%', borderRadius: 5 },
  dayLabel: { fontSize: 11, color: T.ON_NAVY_MUT },
  card: {
    marginHorizontal: 20, backgroundColor: T.SURFACE,
    borderRadius: T.R_MD, overflow: 'hidden',
    borderWidth: 1, borderColor: T.LINE, ...T.SHADOW_SM,
  },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15 },
  breakdownIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: T.SURFACE_2, alignItems: 'center', justifyContent: 'center' },
  breakdownLabel: { flex: 1, fontSize: 14.5, fontWeight: '500', color: T.TEXT },
  breakdownValue: { fontSize: 15, fontWeight: '600', color: T.TEXT },
  transferBtn: {
    height: 56, backgroundColor: T.AMBER, borderRadius: T.R_MD,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    ...T.SHADOW_AMBER,
  },
  transferBtnText: { fontSize: 17, fontWeight: '600', color: T.ON_AMBER },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: T.TEXT, marginBottom: 10 },
});
