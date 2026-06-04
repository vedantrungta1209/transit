import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/stores/auth';
import { initI18n } from '../src/i18n';

const queryClient = new QueryClient();

export default function RootLayout() {
  const hydrate = useAuthStore(s => s.hydrate);
  useEffect(() => { hydrate(); initI18n(); }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
