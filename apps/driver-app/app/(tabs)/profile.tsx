import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '../../src/stores/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { disconnectSocket } from '../../src/lib/socket';
import { T } from '../../src/lib/theme';

const KYC_COLOR: Record<string, string> = {
  VERIFIED: T.SUCCESS,
  PENDING: '#E8941A',
  REJECTED: T.DANGER,
};

const KYC_BG: Record<string, string> = {
  VERIFIED: T.SUCCESS_SOFT,
  PENDING: T.AMBER_SOFT,
  REJECTED: '#FEF2F0',
};

const VEHICLE_ICON: Record<string, string> = {
  BIKE: '🏍', AUTO: '🛺', CAB: '🚗', EV_CAB: '⚡',
};

export default function ProfileScreen() {
  const { driver, logout } = useAuthStore();
  const { data } = useQuery({
    queryKey: ['driverProfile'],
    queryFn: () => api.get('/drivers/me').then(r => r.data.data),
  });

  async function handleLogout() {
    await logout();
    disconnectSocket();
    router.replace('/auth/phone');
  }

  const profile = data || driver;
  const initials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'DV';
  const kycStatus = profile?.kycStatus || 'PENDING';

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={s.header}>
          <Text style={s.title}>Account</Text>
        </View>

        {/* Avatar + name */}
        <View style={s.avatarCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{profile?.name || 'Driver'}</Text>
            <Text style={s.userPhone}>{profile?.phone}</Text>
          </View>
          <View style={[s.kycBadge, { backgroundColor: KYC_BG[kycStatus] }]}>
            <Text style={[s.kycText, { color: KYC_COLOR[kycStatus] }]}>{kycStatus}</Text>
          </View>
        </View>

        {/* Vehicle card */}
        <View style={s.vehicleCard}>
          <View style={s.vehicleIconBox}>
            <Text style={{ fontSize: 22 }}>{VEHICLE_ICON[profile?.vehicleType] || '🚗'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.vehicleNumber}>{profile?.vehicleNumber || 'Not set'}</Text>
            <Text style={s.vehicleModel}>{profile?.vehicleModel} {profile?.vehicleYear} · {profile?.vehicleType}</Text>
          </View>
        </View>

        {/* KYC prompt */}
        {kycStatus !== 'VERIFIED' && (
          <TouchableOpacity onPress={() => router.push('/auth/kyc')} style={s.kycPrompt}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>📄</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.kycPromptTitle}>Complete KYC</Text>
              <Text style={s.kycPromptSub}>Upload documents to start accepting rides</Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M9 5l7 7-7 7" stroke={T.AMBER_DEEP} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        )}

        {/* Menu */}
        <View style={[s.menuCard, { marginBottom: 16 }]}>
          {[
            { icon: '💸', label: 'Earnings', route: '/(tabs)/earnings' },
            { icon: '📋', label: 'Plan & Subscription', route: '/(tabs)/subscription' },
            { icon: '💬', label: 'Help & Support', route: null },
            { icon: '🔒', label: 'Privacy Policy', route: null },
          ].map((item, k) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => item.route ? router.push(item.route as any) : null}
              style={[s.menuRow, k > 0 && { borderTopWidth: 1, borderTopColor: T.LINE }]}
            >
              <View style={s.menuIcon}>
                <Text style={{ fontSize: 17 }}>{item.icon}</Text>
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M9 5l7 7-7 7" stroke={T.TEXT_FAINT} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
            <Text style={s.logoutText}>Sign out</Text>
          </TouchableOpacity>
          <Text style={s.versionText}>Transit Driver v1.0 · Zero commission{'\n'}by Shankh Technologies</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.PAPER },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '600', color: T.TEXT, letterSpacing: -0.4 },
  avatarCard: {
    marginHorizontal: 20, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: T.SURFACE, borderRadius: T.R_MD,
    padding: 18, borderWidth: 1, borderColor: T.LINE, ...T.SHADOW_SM,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: T.NAVY, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  userName: { fontSize: 18, fontWeight: '600', color: T.TEXT },
  userPhone: { fontSize: 13, color: T.TEXT_MUTED, marginTop: 2 },
  kycBadge: {
    borderRadius: T.R_PILL, paddingHorizontal: 10, paddingVertical: 5,
  },
  kycText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  vehicleCard: {
    marginHorizontal: 20, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: T.SURFACE, borderRadius: T.R_MD,
    padding: 16, borderWidth: 1, borderColor: T.LINE, ...T.SHADOW_SM,
  },
  vehicleIconBox: {
    width: 52, height: 52, borderRadius: T.R_SM,
    backgroundColor: T.SURFACE_2, alignItems: 'center', justifyContent: 'center',
  },
  vehicleNumber: { fontSize: 17, fontWeight: '600', color: T.TEXT },
  vehicleModel: { fontSize: 13, color: T.TEXT_MUTED, marginTop: 2 },
  kycPrompt: {
    marginHorizontal: 20, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: T.AMBER_SOFT, borderRadius: T.R_MD,
    padding: 14, borderWidth: 1, borderColor: T.AMBER_LINE,
  },
  kycPromptTitle: { fontSize: 14.5, fontWeight: '600', color: T.TEXT },
  kycPromptSub: { fontSize: 12.5, color: T.TEXT_MUTED, marginTop: 1 },
  menuCard: {
    marginHorizontal: 20, backgroundColor: T.SURFACE,
    borderRadius: T.R_MD, overflow: 'hidden',
    borderWidth: 1, borderColor: T.LINE, ...T.SHADOW_SM,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 18, paddingVertical: 16,
  },
  menuIcon: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: T.SURFACE_2, alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: T.TEXT },
  logoutBtn: {
    height: 52, borderRadius: T.R_MD,
    borderWidth: 1.5, borderColor: T.DANGER,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: T.DANGER },
  versionText: { textAlign: 'center', fontSize: 12, color: T.TEXT_FAINT, lineHeight: 18 },
});
