import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { T } from '../../src/lib/theme';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  RIDE: '🛺',
  PROMO: '🎁',
  PAYMENT: '💳',
  SYSTEM: '🔔',
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsScreen() {
  const { data, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/users/me/notifications').then(r => r.data.data || []),
  });

  const items: Notification[] = data || [];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={s.header}>
          <Text style={s.title}>Notifications</Text>
        </View>

        {isLoading && (
          <View style={s.emptyBox}>
            <Text style={{ fontSize: 14, color: T.TEXT_MUTED }}>Loading…</Text>
          </View>
        )}

        {!isLoading && items.length === 0 && (
          <View style={s.emptyBox}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>🔔</Text>
            <Text style={s.emptyTitle}>All caught up</Text>
            <Text style={s.emptyBody}>Ride updates, offers, and important alerts will appear here.</Text>
          </View>
        )}

        {items.map((n, k) => (
          <TouchableOpacity
            key={n.id}
            style={[s.card, !n.read && s.cardUnread, k > 0 && { marginTop: 0 }]}
            activeOpacity={0.7}
          >
            <View style={[s.iconBox, !n.read && { backgroundColor: T.NAVY + '18' }]}>
              <Text style={{ fontSize: 20 }}>{TYPE_ICON[n.type] || '🔔'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={[s.notifTitle, !n.read && { color: T.NAVY, fontWeight: '700' }]}>{n.title}</Text>
                <Text style={s.time}>{timeAgo(n.createdAt)}</Text>
              </View>
              <Text style={s.notifBody}>{n.body}</Text>
            </View>
            {!n.read && <View style={s.unreadDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.PAPER },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '600', color: T.TEXT, letterSpacing: -0.4 },
  emptyBox: {
    marginTop: 80, alignItems: 'center', paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: T.TEXT, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: T.TEXT_MUTED, textAlign: 'center', lineHeight: 20 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    marginHorizontal: 16, marginBottom: 1,
    backgroundColor: T.SURFACE, padding: 16,
    borderBottomWidth: 1, borderBottomColor: T.LINE,
  },
  cardUnread: { backgroundColor: '#F0F4FF' },
  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: T.SURFACE_2, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  notifTitle: { fontSize: 14.5, fontWeight: '500', color: T.TEXT, flexShrink: 1 },
  notifBody: { fontSize: 13, color: T.TEXT_MUTED, lineHeight: 18 },
  time: { fontSize: 11.5, color: T.TEXT_FAINT, marginLeft: 8, flexShrink: 0 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.NAVY, alignSelf: 'center', flexShrink: 0 },
});
