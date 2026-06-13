import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/auth';
import { T } from '../src/lib/theme';

export default function Index() {
  const { token, isHydrated } = useAuthStore(s => ({ token: s.token, isHydrated: s.isHydrated }));
  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: T.NAVY, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={T.AMBER} size="large" />
      </View>
    );
  }
  return <Redirect href={token ? '/(tabs)/home' : '/welcome'} />;
}
