import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { T } from '../lib/theme';

export default function SearchingView({ onCancel }: { onCancel: () => void }) {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.inner}>
        <View style={s.spinner}>
          <ActivityIndicator size="large" color={T.AMBER} />
        </View>
        <Text style={s.title}>Finding your driver…</Text>
        <Text style={s.sub}>Matching you with nearby drivers</Text>

        <View style={s.dots}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[s.dot, { opacity: 0.3 + i * 0.3 }]} />
          ))}
        </View>

        <TouchableOpacity onPress={onCancel} style={s.cancelBtn}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.INK_900 },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  spinner: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: T.AMBER_SOFT,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 1, borderColor: T.AMBER_LINE,
  },
  title: { fontSize: 22, fontWeight: '600', color: T.ON_NAVY, marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 15, color: T.ON_NAVY_MUT, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  dots: { flexDirection: 'row', gap: 10, marginBottom: 48 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.AMBER },
  cancelBtn: {
    borderWidth: 1, borderColor: T.AMBER_LINE,
    borderRadius: T.R_PILL, paddingHorizontal: 28, paddingVertical: 14,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: T.AMBER },
});
