import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import Svg, { Path } from 'react-native-svg';
import { api } from '../../src/lib/api';
import { T } from '../../src/lib/theme';
import RazorpayCheckout from 'react-native-razorpay';

const TOPUP_AMOUNTS = [100, 200, 500, 1000];

export default function WalletScreen() {
  const { data, refetch } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/users/me/wallet').then(r => r.data.data),
  });

  const topupMutation = useMutation({
    mutationFn: async (amt: number) => {
      const { data: order } = await api.post('/users/me/wallet/topup', { amount: amt });
      await RazorpayCheckout.open({
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY || '',
        order_id: order.data.razorpayOrderId,
        amount: amt * 100,
        currency: 'INR',
        name: 'Transit Wallet',
        description: 'Wallet Top-Up',
        prefill: { contact: '' },
      });
    },
    onSuccess: (_, amt) => { Alert.alert('Added!', `₹${amt} added to your wallet.`); refetch(); },
    onError: () => {},
  });

  const balance = Number(data?.balance || 0);
  const transactions: any[] = data?.transactions || [];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={s.header}>
          <Text style={s.title}>Wallet</Text>
        </View>

        {/* Balance card */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>Available Balance</Text>
          <Text style={s.balanceAmount}>₹{balance.toLocaleString('en-IN')}</Text>
          <View style={s.balanceDivider} />
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm0-14v4l3 3" stroke={T.ON_NAVY_MUT} strokeWidth={1.8} strokeLinecap="round" />
            </Svg>
            <Text style={{ fontSize: 13, color: T.ON_NAVY_MUT }}>Instant payments on every ride</Text>
          </View>
        </View>

        {/* Add money */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={s.sectionTitle}>Add money</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {TOPUP_AMOUNTS.map(amt => (
              <TouchableOpacity
                key={amt}
                onPress={() => topupMutation.mutate(amt)}
                disabled={topupMutation.isPending}
                style={s.topupBtn}
              >
                <Text style={s.topupText}>₹{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transactions */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.sectionTitle}>Transactions</Text>
          {transactions.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>💳</Text>
              <Text style={{ fontSize: 14, color: T.TEXT_MUTED }}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((txn: any) => {
              const isCredit = txn.type === 'TOP_UP';
              return (
                <View key={txn.id} style={s.txnRow}>
                  <View style={[s.txnIcon, { backgroundColor: isCredit ? T.SUCCESS_SOFT : '#FEF2F0' }]}>
                    <Text style={{ fontSize: 16 }}>{isCredit ? '↓' : '↑'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txnLabel}>{isCredit ? 'Money added' : 'Ride payment'}</Text>
                    <Text style={s.txnDate}>{new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                  </View>
                  <Text style={[s.txnAmount, { color: isCredit ? T.SUCCESS : T.DANGER }]}>
                    {isCredit ? '+' : '-'}₹{txn.amount}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.PAPER },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '600', color: T.TEXT, letterSpacing: -0.4 },
  balanceCard: {
    marginHorizontal: 20, marginBottom: 24,
    backgroundColor: T.NAVY, borderRadius: T.R_LG,
    padding: 24, ...T.SHADOW_MD,
  },
  balanceLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.4, color: T.ON_NAVY_MUT, textTransform: 'uppercase', marginBottom: 4 },
  balanceAmount: { fontSize: 46, fontWeight: '700', letterSpacing: -1.5, color: '#fff', lineHeight: 50, marginBottom: 16 },
  balanceDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '600', letterSpacing: 1, color: T.TEXT_FAINT, textTransform: 'uppercase', marginBottom: 12 },
  topupBtn: {
    flex: 1, height: 50, borderRadius: T.R_SM,
    backgroundColor: T.SURFACE, borderWidth: 1, borderColor: T.LINE,
    alignItems: 'center', justifyContent: 'center', ...T.SHADOW_SM,
  },
  topupText: { fontSize: 15, fontWeight: '600', color: T.TEXT },
  emptyBox: {
    paddingVertical: 32, alignItems: 'center',
    backgroundColor: T.SURFACE, borderRadius: T.R_MD,
    borderWidth: 1, borderColor: T.LINE,
  },
  txnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: T.SURFACE, borderRadius: T.R_MD,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: T.LINE, ...T.SHADOW_SM,
  },
  txnIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txnLabel: { fontSize: 14.5, fontWeight: '500', color: T.TEXT },
  txnDate: { fontSize: 12, color: T.TEXT_FAINT, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '700' },
});
