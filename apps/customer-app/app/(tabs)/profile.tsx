import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '../../src/stores/auth';
import { disconnectSocket } from '../../src/lib/socket';
import { T } from '../../src/lib/theme';

const MENU_ITEMS = [
  { icon: '📋', label: 'My Trips', route: '/(tabs)/rides' },
  { icon: '💬', label: 'Help & Support', route: null },
  { icon: '🔒', label: 'Privacy Policy', route: null },
  { icon: '⭐', label: 'Rate the App', route: null },
];

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    disconnectSocket();
    router.replace('/auth/phone');
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'RV';

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
            <Text style={s.userName}>{user?.name || 'Transit Rider'}</Text>
            <Text style={s.userPhone}>{user?.phone}</Text>
          </View>
          <View style={s.ratingBadge}>
            <Text style={{ fontSize: 13, marginRight: 3 }}>★</Text>
            <Text style={s.ratingText}>4.8</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={[s.menuCard, { marginBottom: 16 }]}>
          {MENU_ITEMS.map((item, k) => (
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
          <Text style={s.versionText}>Transit v1.0 · All fares are upfront</Text>
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
    marginHorizontal: 20, marginBottom: 16,
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
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.AMBER_SOFT, borderRadius: T.R_PILL,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: T.AMBER_LINE,
  },
  ratingText: { fontSize: 14, fontWeight: '700', color: T.AMBER_DEEP },
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
    borderWidth: 1.5, borderColor: '#DC4E37',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: T.DANGER },
  versionText: { textAlign: 'center', fontSize: 12, color: T.TEXT_FAINT },
});
