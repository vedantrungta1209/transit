import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { T } from '../../src/lib/theme';

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  IN_PROGRESS: 'In Progress',
};
const STATUS_COLOR: Record<string, string> = {
  COMPLETED: T.SUCCESS,
  CANCELLED: T.DANGER,
  IN_PROGRESS: T.NAVY,
};
const VEHICLE_LABEL: Record<string, string> = {
  BIKE: '🏍 Bike', AUTO: '🛺 Auto', CAB: '🚗 Cab', EV_CAB: '⚡ EV Cab',
};

export default function RidesScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['ride-history'],
    queryFn: () => api.get('/rides/history').then(r => r.data.data),
  });

  const rides: any[] = data?.data ?? [];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={s.header}>
          <Text style={s.title}>My Trips</Text>
        </View>

        {isLoading && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ color: T.TEXT_FAINT, fontSize: 15 }}>Loading…</Text>
          </View>
        )}

        {!isLoading && rides.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Text style={{ fontSize: 32, marginBottom: 14 }}>🛺</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: T.TEXT, marginBottom: 6 }}>No trips yet</Text>
            <Text style={{ fontSize: 14, color: T.TEXT_MUTED }}>Book your first ride to get started</Text>
          </View>
        )}

        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {rides.map((ride: any) => (
            <View key={ride.id} style={s.card}>
              {/* Header row */}
              <View style={s.cardHeader}>
                <View style={s.vehicleChip}>
                  <Text style={s.vehicleChipText}>{VEHICLE_LABEL[ride.vehicleType] || ride.vehicleType}</Text>
                </View>
                <View style={[s.statusPill, { backgroundColor: STATUS_COLOR[ride.status] + '18' }]}>
                  <Text style={[s.statusText, { color: STATUS_COLOR[ride.status] || T.TEXT_MUTED }]}>
                    {STATUS_LABEL[ride.status] || ride.status}
                  </Text>
                </View>
              </View>

              {/* Route */}
              <View style={s.routeSection}>
                <View style={s.routeStop}>
                  <View style={[s.routeDot, { backgroundColor: T.NAVY }]} />
                  <Text style={s.routeAddr} numberOfLines={1}>{ride.pickupAddress || 'Pickup'}</Text>
                </View>
                <View style={s.routeLine} />
                <View style={s.routeStop}>
                  <View style={[s.routeDot, { borderRadius: 3, backgroundColor: T.AMBER }]} />
                  <Text style={s.routeAddr} numberOfLines={1}>{ride.dropAddress || 'Drop'}</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={s.cardFooter}>
                <Text style={s.dateText}>
                  {new Date(ride.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={s.payMethod}>{ride.paymentMethod}</Text>
                  {ride.actualFare != null && (
                    <Text style={s.fareText}>₹{Number(ride.actualFare).toLocaleString('en-IN')}</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.PAPER },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '600', color: T.TEXT, letterSpacing: -0.4 },
  card: {
    backgroundColor: T.SURFACE, borderRadius: T.R_LG,
    padding: 16, borderWidth: 1, borderColor: T.LINE, ...T.SHADOW_SM,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  vehicleChip: { backgroundColor: T.NAVY, borderRadius: T.R_PILL, paddingHorizontal: 12, paddingVertical: 5 },
  vehicleChipText: { fontSize: 13, fontWeight: '600', color: T.ON_NAVY },
  statusPill: { borderRadius: T.R_PILL, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  routeSection: { marginBottom: 14 },
  routeStop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeAddr: { flex: 1, fontSize: 14, fontWeight: '500', color: T.TEXT },
  routeLine: { width: 1.5, height: 14, backgroundColor: T.LINE, marginLeft: 4.5, marginVertical: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: T.LINE, paddingTop: 12 },
  dateText: { fontSize: 12.5, color: T.TEXT_FAINT },
  payMethod: { fontSize: 12, color: T.TEXT_MUTED, backgroundColor: T.SURFACE_2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: T.R_PILL },
  fareText: { fontSize: 16, fontWeight: '700', color: T.TEXT },
});
