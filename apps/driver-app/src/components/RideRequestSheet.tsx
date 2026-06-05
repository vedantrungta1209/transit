import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { T } from '../lib/theme';

interface Props {
  request: {
    rideId: string;
    distanceToPickup: string;
    vehicleType: string;
    timeoutSeconds: number;
    estimatedFare?: number;
    pickupAddress?: string;
    dropAddress?: string;
    distanceKm?: number;
    estimatedMinutes?: number;
    paymentMethod?: string;
  };
  onAccept: (rideId: string) => void;
  onDecline: () => void;
}

function money(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

const VEHICLE_LABEL: Record<string, string> = {
  BIKE: 'Bike', AUTO: 'Auto', CAB: 'Cab', EV_CAB: 'EV Cab',
};

export default function RideRequestSheet({ request, onAccept, onDecline }: Props) {
  const [timeLeft, setTimeLeft] = useState(request.timeoutSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); onDecline(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [request.rideId]);

  const progress = timeLeft / request.timeoutSeconds;
  const fare = request.estimatedFare ?? 64;
  const vehicleLabel = VEHICLE_LABEL[request.vehicleType] || request.vehicleType;

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

      {/* Header */}
      <View style={s.headerRow}>
        <View style={s.vehicleChip}>
          <Text style={{ fontSize: 14, marginRight: 6 }}>
            {request.vehicleType === 'BIKE' ? '🏍' : request.vehicleType === 'AUTO' ? '🛺' : '🚗'}
          </Text>
          <Text style={s.vehicleChipText}>New {vehicleLabel} request</Text>
        </View>
        <View style={[s.timerCircle, timeLeft <= 5 && { borderColor: T.DANGER }]}>
          <Text style={[s.timerText, timeLeft <= 5 && { color: T.DANGER }]}>{timeLeft}</Text>
        </View>
      </View>

      {/* Fare */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <Text style={s.fareAmount}>{money(fare)}</Text>
        <Text style={s.keepText}>You keep all of it</Text>
      </View>
      <Text style={s.fareDetail}>
        {request.distanceKm ? `${Number(request.distanceKm).toFixed(1)} km` : request.distanceToPickup + ' km to pickup'} · ~{request.estimatedMinutes || 22} min · {request.paymentMethod || 'Cash'}
      </Text>

      {/* Progress bar */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${progress * 100}%` as any, backgroundColor: timeLeft <= 5 ? T.DANGER : T.AMBER }]} />
      </View>

      {/* Route */}
      <View style={s.routeBox}>
        <View style={s.routeStop}>
          <View style={[s.routeDot, { backgroundColor: T.NAVY, borderRadius: 6 }]} />
          <View>
            <Text style={s.routeMain}>{request.distanceToPickup} km away · {request.estimatedMinutes || 4} min</Text>
            <Text style={s.routeSub}>Pickup — {request.pickupAddress || 'Hazratganj'}</Text>
          </View>
        </View>
        <View style={s.routeDivider} />
        <View style={s.routeStop}>
          <View style={[s.routeDot, { backgroundColor: T.AMBER, borderRadius: 3 }]} />
          <View>
            <Text style={s.routeMain}>{request.dropAddress || 'Destination'}</Text>
            <Text style={s.routeSub}>Drop</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={onDecline} style={s.skipBtn}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onAccept(request.rideId)} style={s.acceptBtn}>
          <Text style={s.acceptText}>Accept</Text>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M9 5l7 7-7 7" stroke={T.ON_AMBER} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: T.SURFACE, borderTopLeftRadius: T.R_XL, borderTopRightRadius: T.R_XL,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30, ...T.SHADOW_SHEET,
  },
  handle: { width: 40, height: 5, borderRadius: 99, backgroundColor: T.LINE, alignSelf: 'center', marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  vehicleChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.NAVY, borderRadius: T.R_PILL,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  vehicleChipText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  timerCircle: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: T.AMBER_LINE,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.AMBER_SOFT,
  },
  timerText: { fontSize: 18, fontWeight: '700', color: T.AMBER_DEEP },
  fareAmount: { fontSize: 42, fontWeight: '700', color: T.TEXT, letterSpacing: -1, lineHeight: 46 },
  keepText: { fontSize: 13, fontWeight: '600', color: T.SUCCESS },
  fareDetail: { fontSize: 13, color: T.TEXT_MUTED, marginBottom: 16 },
  progressTrack: { height: 4, backgroundColor: T.LINE, borderRadius: 99, marginBottom: 18, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  routeBox: { marginBottom: 20, paddingLeft: 8 },
  routeStop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  routeDot: { width: 12, height: 12, marginTop: 3, borderWidth: 2, borderColor: T.SURFACE, shadowColor: T.LINE, shadowRadius: 1, shadowOpacity: 1 },
  routeDivider: { width: 2, height: 14, backgroundColor: T.LINE, marginLeft: 5, marginVertical: 2 },
  routeMain: { fontSize: 15, fontWeight: '600', color: T.TEXT },
  routeSub: { fontSize: 12.5, color: T.TEXT_MUTED, marginTop: 2 },
  skipBtn: {
    width: 86, height: 56, borderRadius: T.R_MD,
    borderWidth: 1, borderColor: T.LINE, backgroundColor: T.SURFACE,
    alignItems: 'center', justifyContent: 'center',
  },
  skipText: { fontSize: 15, fontWeight: '600', color: T.TEXT_MUTED },
  acceptBtn: {
    flex: 1, height: 56, borderRadius: T.R_MD,
    backgroundColor: T.AMBER, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6, ...T.SHADOW_AMBER,
  },
  acceptText: { fontSize: 17, fontWeight: '600', color: T.ON_AMBER },
});
