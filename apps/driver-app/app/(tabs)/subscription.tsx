import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import RazorpayCheckout from 'react-native-razorpay';

export default function SubscriptionScreen() {
  const { data, refetch } = useQuery({ queryKey: ['subscription'], queryFn: () => api.get('/drivers/me/subscription').then(r => r.data.data) });

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
    onSuccess: () => { Alert.alert('Success', 'Subscription activated!'); refetch(); },
    onError: () => Alert.alert('Error', 'Payment failed. Please try again.'),
  });

  const active = data?.currentSubscription;
  const plans = data?.availablePlans || [];

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 20 }}>
      <Text className="text-2xl font-bold text-gray-900 mt-8 mb-6">Subscription</Text>

      {active ? (
        <View className="bg-blue-600 rounded-2xl p-5 mb-6">
          <Text className="text-white text-sm mb-1">Active Plan</Text>
          <Text className="text-white text-xl font-bold mb-1">{active.plan?.name}</Text>
          <Text className="text-blue-100 text-sm">Valid till {new Date(active.endDate).toLocaleDateString('en-IN')}</Text>
        </View>
      ) : (
        <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
          <Text className="text-yellow-800 font-medium">No active subscription</Text>
          <Text className="text-yellow-600 text-sm mt-1">Subscribe to a plan to access all rides</Text>
        </View>
      )}

      <Text className="text-base font-semibold text-gray-900 mb-3">Available Plans</Text>
      {plans.map((plan: any) => (
        <View key={plan.id} className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-base font-bold text-gray-900">{plan.name}</Text>
            <View className="bg-blue-50 px-3 py-1 rounded-full">
              <Text className="text-blue-600 text-sm font-semibold">₹{plan.basePrice}/{plan.billingCycle === 'WEEKLY' ? 'week' : 'month'}</Text>
            </View>
          </View>
          <Text className="text-sm text-gray-500 mb-1">Peak hours: {(Number(plan.peakHoursDiscount) * 100).toFixed(0)}% off ({plan.peakHoursStart}–{plan.peakHoursEnd})</Text>
          <Text className="text-sm text-gray-500 mb-4">Off-peak: {(Number(plan.offPeakDiscount) * 100).toFixed(0)}% off</Text>
          <TouchableOpacity
            onPress={() => subscribeMutation.mutate(plan.id)}
            disabled={subscribeMutation.isPending || !!active}
            className="bg-blue-600 rounded-xl py-3 items-center disabled:opacity-50"
          >
            <Text className="text-white font-semibold">{active ? 'Already Subscribed' : 'Subscribe Now'}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
