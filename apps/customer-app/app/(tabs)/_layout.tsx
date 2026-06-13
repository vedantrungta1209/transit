import { Tabs } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { T } from '../../src/lib/theme';

function IconHome({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 11l8-7 8 7 M6 9.5V20h12V9.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function IconRoute({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="17" r="2.5" stroke={color} strokeWidth={1.8} />
      <Circle cx="18" cy="7.5" r="2.5" stroke={color} strokeWidth={1.8} />
      <Path d="M8.5 14.5h6a3 3 0 0 0 0-6h-5a3 3 0 0 1 0-6H10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
function IconWallet({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth={1.8} />
      <Path d="M16 12.5h3.5 M3 8.5h13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
function IconBell({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function IconTag({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="7" cy="7" r="1.5" fill={color} />
    </Svg>
  );
}
function IconUser({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: T.NAVY,
        tabBarInactiveTintColor: T.TEXT_FAINT,
        tabBarStyle: {
          backgroundColor: T.SURFACE,
          borderTopColor: T.LINE,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 14,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Ride', tabBarIcon: ({ color }) => <IconHome color={color} /> }} />
      <Tabs.Screen name="rides" options={{ title: 'Trips', tabBarIcon: ({ color }) => <IconRoute color={color} /> }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet', tabBarIcon: ({ color }) => <IconWallet color={color} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Alerts', tabBarIcon: ({ color }) => <IconBell color={color} /> }} />
      <Tabs.Screen name="offers" options={{ title: 'Offers', tabBarIcon: ({ color }) => <IconTag color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Account', tabBarIcon: ({ color }) => <IconUser color={color} /> }} />
    </Tabs>
  );
}
