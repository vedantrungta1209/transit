import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import RazorpayCheckout from 'react-native-razorpay';
import { useState } from 'react';

export default function WalletScreen() {
  const { data, refetch } = useQuery({ queryKey: ['wallet'], queryFn: () => api.get('/users/me/wallet').then(r => r.data.data) });
  const [amount, setAmount] = useState(0);

  async function addMoney(amt: number) {
    try {
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
      Alert.alert('Success', `₹${amt} added to wallet!`);
      refetch();
    } catch {}
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 20 }}>
      <Text className="text-2xl font-bold text-gray-900 mt-8 mb-4">Wallet</Text>
      <View className="bg-blue-600 rounded-3xl p-6 mb-6">
        <Text className="text-blue-100 text-sm mb-1">Available Balance</Text>
        <Text className="text-white text-4xl font-bold">₹{Number(data?.balance || 0).toLocaleString('en-IN')}</Text>
      </View>
      <Text className="text-sm font-semibold text-gray-700 mb-3">Add Money</Text>
      <View className="flex-row gap-3 mb-6">
        {[100, 200, 500, 1000].map(amt => (
          <TouchableOpacity key={amt} onPress={() => addMoney(amt)} className="flex-1 bg-white border rounded-xl py-3 items-center shadow-sm">
            <Text className="text-sm font-semibold text-gray-900">₹{amt}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text className="text-sm font-semibold text-gray-700 mb-3">Transactions</Text>
      {data?.transactions?.map((txn: any) => (
        <View key={txn.id} className="bg-white rounded-xl px-4 py-3 mb-2 flex-row justify-between shadow-sm">
          <View><Text className="text-sm font-medium text-gray-900">{txn.type === 'TOP_UP' ? 'Added Money' : 'Ride Payment'}</Text><Text className="text-xs text-gray-400">{new Date(txn.createdAt).toLocaleDateString('en-IN')}</Text></View>
          <Text className={`font-bold text-sm ${txn.type === 'TOP_UP' ? 'text-green-600' : 'text-red-600'}`}>{txn.type === 'TOP_UP' ? '+' : '-'}₹{txn.amount}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
