import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '../../src/stores/auth';
import { disconnectSocket } from '../../src/lib/socket';
import { api } from '../../src/lib/api';
import { T } from '../../src/lib/theme';

type EditField = 'name' | 'email' | null;

const MENU_ITEMS = [
  { icon: '📋', label: 'My Trips', route: '/(tabs)/rides' },
  { icon: '🎁', label: 'Offers & Coupons', route: '/(tabs)/offers' },
  { icon: '🔔', label: 'Notifications', route: '/(tabs)/notifications' },
  { icon: '💬', label: 'Help & Support', route: null },
  { icon: '🔒', label: 'Privacy Policy', route: null },
  { icon: '⭐', label: 'Rate the App', route: null },
];

export default function ProfileScreen() {
  const { user: storedUser, logout, setUser } = useAuthStore();
  const [editField, setEditField] = useState<EditField>(null);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: fetchedUser, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/me').then(r => r.data.data),
    retry: 2,
    onSuccess: (data: any) => { if (data) setUser(data); },
  } as any);

  const user = fetchedUser || storedUser;

  async function handleLogout() {
    await logout();
    disconnectSocket();
    router.replace('/auth/phone');
  }

  function openEdit(field: EditField) {
    setInput(field === 'name' ? (user?.name || '') : (user?.email || ''));
    setEditField(field);
  }

  async function saveField() {
    const trimmed = input.trim();
    if (!trimmed) { Alert.alert('Please enter a value'); return; }
    setSaving(true);
    try {
      const payload = editField === 'name' ? { name: trimmed } : { email: trimmed };
      const { data } = await api.patch('/users/me', payload);
      setUser(data.data.user);
      setEditField(null);
    } catch {
      Alert.alert('Error', 'Could not update. Please try again.');
    }
    setSaving(false);
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all ride history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/users/me');
              await logout();
              disconnectSocket();
              router.replace('/auth/phone');
            } catch {
              Alert.alert('Error', 'Could not delete account. Contact support.');
            }
          },
        },
      ]
    );
  }

  if (profileLoading && !user) {
    return (
      <SafeAreaView style={s.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={T.NAVY} />
          <Text style={{ fontSize: 14, color: T.TEXT_MUTED, marginTop: 12 }}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = user?.name || 'Transit Rider';
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.phone?.slice(-2) ?? 'TR';

  const editTitle = editField === 'name' ? 'Your name' : 'Your email';
  const editPlaceholder = editField === 'name' ? 'e.g. Rahul Sharma' : 'e.g. rahul@gmail.com';

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={s.header}>
          <Text style={s.title}>Account</Text>
        </View>

        {/* Avatar + name */}
        <TouchableOpacity style={s.avatarCard} onPress={() => openEdit('name')}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{displayName}</Text>
            <Text style={s.userPhone}>{user?.phone}</Text>
            {!user?.name && (
              <Text style={{ fontSize: 12, color: T.AMBER_DEEP, marginTop: 3, fontWeight: '500' }}>Tap to set your name</Text>
            )}
          </View>
          <View style={s.ratingBadge}>
            <Text style={{ fontSize: 13, marginRight: 3 }}>★</Text>
            <Text style={s.ratingText}>4.8</Text>
          </View>
        </TouchableOpacity>

        {/* Quick edit fields */}
        <View style={[s.menuCard, { marginBottom: 16 }]}>
          <TouchableOpacity style={s.menuRow} onPress={() => openEdit('name')}>
            <View style={s.menuIcon}><Text style={{ fontSize: 17 }}>✏️</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Name</Text>
              <Text style={{ fontSize: 13, color: T.TEXT_MUTED }}>{user?.name || 'Not set'}</Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M9 5l7 7-7 7" stroke={T.TEXT_FAINT} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity style={[s.menuRow, { borderTopWidth: 1, borderTopColor: T.LINE }]} onPress={() => openEdit('email')}>
            <View style={s.menuIcon}><Text style={{ fontSize: 17 }}>📧</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Email</Text>
              <Text style={{ fontSize: 13, color: T.TEXT_MUTED }}>{user?.email || 'Not set'}</Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M9 5l7 7-7 7" stroke={T.TEXT_FAINT} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={[s.menuRow, { borderTopWidth: 1, borderTopColor: T.LINE }]}>
            <View style={s.menuIcon}><Text style={{ fontSize: 17 }}>📱</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Phone</Text>
              <Text style={{ fontSize: 13, color: T.TEXT_MUTED }}>{user?.phone}</Text>
            </View>
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

        {/* Logout + delete */}
        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
            <Text style={s.logoutText}>Sign out</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDeleteAccount} style={s.deleteBtn}>
            <Text style={s.deleteText}>Delete Account</Text>
          </TouchableOpacity>
          <Text style={s.versionText}>Transit v1.0 · All fares are upfront{'\n'}by Shankh Technologies</Text>
        </View>
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={editField !== null} transparent animationType="slide" onRequestClose={() => setEditField(null)}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setEditField(null)} />
          <View style={s.modalSheet}>
          <View style={s.sheetHandle} />
          <Text style={s.modalTitle}>{editTitle}</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={editPlaceholder}
            placeholderTextColor={T.TEXT_FAINT}
            style={s.nameInput}
            autoFocus
            returnKeyType="done"
            keyboardType={editField === 'email' ? 'email-address' : 'default'}
            autoCapitalize={editField === 'email' ? 'none' : 'words'}
            onSubmitEditing={saveField}
          />
          <TouchableOpacity onPress={saveField} style={s.saveBtn} disabled={saving}>
            {saving ? <ActivityIndicator color={T.ON_AMBER} /> : <Text style={s.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      </Modal>
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
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: T.NAVY, alignItems: 'center', justifyContent: 'center' },
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
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
  menuIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: T.SURFACE_2, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: T.TEXT },
  logoutBtn: { height: 52, borderRadius: T.R_MD, borderWidth: 1.5, borderColor: '#DC4E37', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  logoutText: { fontSize: 15, fontWeight: '600', color: T.DANGER },
  deleteBtn: { height: 44, borderRadius: T.R_MD, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  deleteText: { fontSize: 13, fontWeight: '500', color: T.TEXT_FAINT, textDecorationLine: 'underline' },
  versionText: { textAlign: 'center', fontSize: 12, color: T.TEXT_FAINT, lineHeight: 18 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: T.SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 14, paddingBottom: 40,
  },
  sheetHandle: { width: 40, height: 5, borderRadius: 99, backgroundColor: T.LINE, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: T.TEXT, marginBottom: 16 },
  nameInput: {
    fontSize: 16, fontWeight: '500', color: T.TEXT,
    backgroundColor: T.SURFACE_2, borderRadius: T.R_MD,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: T.LINE, marginBottom: 16,
  },
  saveBtn: { height: 54, borderRadius: T.R_MD, backgroundColor: T.AMBER, alignItems: 'center', justifyContent: 'center', ...T.SHADOW_AMBER },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: T.ON_AMBER },
});
