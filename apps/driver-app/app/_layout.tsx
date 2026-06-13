import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Updates from 'expo-updates';
import { useAuthStore } from '../src/stores/auth';
import { setUnauthorizedHandler } from '../src/lib/api';
import { initI18n } from '../src/i18n';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { hydrate, logout } = useAuthStore();
  useEffect(() => {
    hydrate();
    initI18n();
    setUnauthorizedHandler(async () => {
      await logout();
      router.replace('/auth/phone');
    });
    if (!__DEV__) {
      Updates.checkForUpdateAsync().then(async ({ isAvailable }) => {
        if (isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      }).catch(() => {});
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
