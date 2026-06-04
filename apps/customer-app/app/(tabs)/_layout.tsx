import { Tabs } from 'expo-router';
import { MapPin, Clock, Wallet, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0284c7', headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <MapPin size={22} color={color} /> }} />
      <Tabs.Screen name="rides" options={{ title: 'Rides', tabBarIcon: ({ color }) => <Clock size={22} color={color} /> }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet', tabBarIcon: ({ color }) => <Wallet size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
    </Tabs>
  );
}
