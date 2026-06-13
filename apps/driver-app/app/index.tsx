import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/auth';

export default function Index() {
  const { token, isHydrated } = useAuthStore(s => ({ token: s.token, isHydrated: s.isHydrated }));
  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F2B5B', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#F7B32B" size="large" />
      </View>
    );
  }
  return <Redirect href={token ? '/(tabs)/home' : '/welcome'} />;
}
