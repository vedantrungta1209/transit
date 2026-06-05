import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useState } from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { T } from '../lib/theme';

interface Props {
  pickup: { lat: number; lng: number; address: string };
  drop: { lat: number; lng: number; address: string };
  onBook: (vehicleType: string, paymentMethod: string) => void;
  onBack: () => void;
}

const VEHICLES = [
  { type: 'BIKE', label: 'Bike', basePrice: 25, eta: '2 min', sub: 'Quickest', color: T.BIKE },
  { type: 'AUTO', label: 'Auto', basePrice: 45, eta: '4 min', sub: 'Best value', color: T.AUTO },
  { type: 'CAB', label: 'Cab · AC', basePrice: 89, eta: '6 min', sub: 'Comfort', color: T.CAB },
];

function BikeIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M6 18.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 18.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 15.5l3.5-6h4l2.5 6 M9 9.5h6 M14 9.5l1.5-3h2" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function AutoIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M3 16.5h18 M4 16.5v-4l3-5h6l4 4v5 M7 16.5a2 2 0 1 1-4 0 M21 16.5a2 2 0 1 1-4 0 M7 7.5v4 M4 11.5h16" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function CabIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M3 16h18 M5 16v-3l2-4h10l2 4v3 M5 13h14 M9 9V7h6v2" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="7.5" cy="17.5" r="1.5" stroke={color} strokeWidth={1.7} />
      <Circle cx="16.5" cy="17.5" r="1.5" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

const vehicleIcons: Record<string, (c: string) => JSX.Element> = {
  BIKE: (c) => <BikeIcon color={c} />,
  AUTO: (c) => <AutoIcon color={c} />,
  CAB: (c) => <CabIcon color={c} />,
};

const PAYMENT_METHODS = [
  { key: 'CASH', label: 'Cash' },
  { key: 'UPI', label: 'UPI' },
  { key: 'WALLET', label: 'Wallet' },
];

export default function VehicleSelectSheet({ pickup, drop, onBook, onBack }: Props) {
  const [selected, setSelected] = useState('AUTO');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const { data: estimate } = useQuery({
    queryKey: ['estimate', pickup.lat, pickup.lng, drop.lat, drop.lng, selected],
    queryFn: () =>
      api.post('/rides/estimate', {
        pickupLat: pickup.lat, pickupLng: pickup.lng,
        dropLat: drop.lat, dropLng: drop.lng,
        vehicleType: selected,
      }).then(r => r.data.data),
  });

  const selectedVehicle = VEHICLES.find(v => v.type === selected)!;
  const fare = estimate?.estimatedFare ?? selectedVehicle.basePrice;
  const distance = estimate?.distance?.toFixed(1) ?? '—';
  const duration = estimate?.duration ?? '—';

  return (
    <View>
      {/* Route summary */}
      <View style={s.routeRow}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7.5V12l3 2" stroke={T.TEXT_MUTED} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
        <Text style={s.routeText}>
          {pickup.address?.split(',')[0]} → {drop.address?.split(',')[0]}
          {'  '}<Text style={{ color: T.TEXT, fontWeight: '600' }}>{duration} min</Text>
        </Text>
      </View>

      {/* Vehicle options */}
      <View style={{ gap: 10, marginBottom: 14 }}>
        {VEHICLES.map(v => {
          const isSel = v.type === selected;
          const vFare = v.type === selected ? fare : v.basePrice;
          return (
            <TouchableOpacity
              key={v.type}
              onPress={() => setSelected(v.type)}
              style={[s.vehicleRow, isSel && s.vehicleRowSel]}
            >
              <View style={s.vehicleIcon}>
                {(vehicleIcons[v.type] || vehicleIcons.CAB)(v.color)}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.vehicleLabel}>{v.label}</Text>
                <Text style={s.vehicleSub}>{v.eta} away · {v.sub}</Text>
              </View>
              <Text style={s.vehicleFare}>₹{Number(vFare).toLocaleString('en-IN')}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Payment method */}
      <View style={s.payRow}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M3 7h18v10H3z M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" stroke={T.SUCCESS} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <Text style={s.payLabel}>{paymentMethod}</Text>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {PAYMENT_METHODS.map(m => (
            <TouchableOpacity
              key={m.key}
              onPress={() => setPaymentMethod(m.key)}
              style={[s.payChip, paymentMethod === m.key && s.payChipSel]}
            >
              <Text style={[s.payChipText, paymentMethod === m.key && { color: T.AMBER_DEEP, fontWeight: '700' }]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Book button */}
      <TouchableOpacity onPress={() => onBook(selected, paymentMethod)} style={s.bookBtn}>
        <Text style={s.bookBtnText}>Book {selectedVehicle.label} · ₹{Number(fare).toLocaleString('en-IN')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  routeText: { fontSize: 13, color: T.TEXT_MUTED, flex: 1 },
  vehicleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: T.R_MD, borderWidth: 1, borderColor: T.LINE,
    backgroundColor: T.SURFACE,
  },
  vehicleRowSel: {
    borderWidth: 2, borderColor: T.AMBER, backgroundColor: T.AMBER_SOFT,
  },
  vehicleIcon: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: T.SURFACE_2, alignItems: 'center', justifyContent: 'center',
  },
  vehicleLabel: { fontSize: 16, fontWeight: '600', color: T.TEXT },
  vehicleSub: { fontSize: 12.5, color: T.TEXT_MUTED, marginTop: 1 },
  vehicleFare: { fontSize: 18, fontWeight: '600', color: T.TEXT },
  payRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 4, marginBottom: 14,
  },
  payLabel: { fontSize: 14.5, fontWeight: '600', color: T.TEXT },
  payChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: T.R_PILL,
    backgroundColor: T.SURFACE_2, borderWidth: 1, borderColor: T.LINE,
  },
  payChipSel: { borderColor: T.AMBER_LINE, backgroundColor: T.AMBER_SOFT },
  payChipText: { fontSize: 13, fontWeight: '500', color: T.TEXT_MUTED },
  bookBtn: {
    width: '100%', height: 56, borderRadius: T.R_MD,
    backgroundColor: T.AMBER, alignItems: 'center', justifyContent: 'center',
    ...T.SHADOW_AMBER,
  },
  bookBtnText: { fontSize: 17, fontWeight: '600', color: T.ON_AMBER },
});
