import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Rect, Path, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';
import { T } from '../src/lib/theme';

const { width, height } = Dimensions.get('window');

function MapBackground() {
  const ink = '#0A1C40';
  const road = '#16264a';
  const park = '#10305a';
  const w = width;
  const h = height * 0.58;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill}>
      <Rect width={w} height={h} fill={ink} />
      <Path d={`M260 0 L${w} 120 L${w} 260 L300 90 Z`} fill={park} opacity="0.7" />
      <Rect x="30" y={h - 140} width="110" height="100" rx="10" fill={park} opacity="0.6" />
      <Svg.Circle cx="320" cy={h - 80} r="55" fill={park} opacity="0.6" />
      {/* Roads */}
      <Path d={`M-20 ${h * 0.3} L${w + 20} ${h * 0.42}`} stroke={road} strokeWidth="13" strokeLinecap="round" opacity="0.9" />
      <Path d={`M-20 ${h * 0.7} L${w + 20} ${h * 0.62}`} stroke={road} strokeWidth="13" strokeLinecap="round" opacity="0.9" />
      <Path d={`M${w * 0.18} -20 L${w * 0.26} ${h + 20}`} stroke={road} strokeWidth="13" strokeLinecap="round" opacity="0.9" />
      <Path d={`M${w * 0.65} -20 L${w * 0.72} ${h + 20}`} stroke={road} strokeWidth="13" strokeLinecap="round" opacity="0.9" />
      <Path d={`M${w * 0.45} -20 L${w * 0.5} ${h + 20}`} stroke={road} strokeWidth="7" strokeLinecap="round" opacity="0.75" />
      {/* Route line */}
      <Path
        d={`M${w * 0.24} ${h} C${w * 0.35} ${h * 0.75} ${w * 0.46} ${h * 0.68} ${w * 0.46} ${h * 0.52} C${w * 0.46} ${h * 0.36} ${w * 0.55} ${h * 0.28} ${w * 0.66} ${h * 0.08}`}
        fill="none" stroke="#F7B32B" strokeWidth="5" strokeLinecap="round"
      />
      {/* Pickup dot */}
      <Svg.Circle cx={w * 0.24} cy={h} r="9" fill="#0F2B5B" />
      <Svg.Circle cx={w * 0.24} cy={h} r="6" fill="#fff" />
      {/* Destination pin */}
      <Path d={`M${w * 0.66} ${h * 0.04} C${w * 0.66} ${h * 0.04} ${w * 0.73} ${h * 0.1} ${w * 0.66} ${h * 0.17} C${w * 0.59} ${h * 0.1} ${w * 0.66} ${h * 0.04} ${w * 0.66} ${h * 0.04}`} fill="#F7B32B" />
      <Svg.Circle cx={w * 0.66} cy={h * 0.1} r="4" fill="#0F2B5B" />
    </Svg>
  );
}

function TransitIcon({ size = 48 }: { size?: number }) {
  const s = size / 120;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#16356A" />
          <Stop offset="1" stopColor="#0A1C40" />
        </LinearGradient>
      </Defs>
      <Rect x="6" y="6" width="108" height="108" rx="28" fill="url(#bg)" />
      <Rect x="32" y="33" width="56" height="13.5" rx="6.75" fill="#F7B32B" />
      <Path d="M53 44 L67 44 L67 70 L78 86 L70 90 L60 80 L50 90 L42 86 L53 70 Z" fill="#F7B32B" />
    </Svg>
  );
}

function ChevRightIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5l7 7-7 7" stroke={T.ON_AMBER} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function WelcomeScreen() {
  return (
    <View style={s.container}>
      {/* Map background */}
      <View style={s.mapArea}>
        <MapBackground />
      </View>

      {/* Bottom content */}
      <View style={s.bottomGradient}>
        <SafeAreaView edges={['bottom']} style={s.content}>
          <View style={s.wordmark}>
            <TransitIcon size={44} />
            <Text style={s.wordmarkText}>Transit</Text>
          </View>

          <Text style={s.headline}>
            Ride. Earn.{'\n'}
            <Text style={s.headlineAccent}>Freedom.</Text>
          </Text>

          <Text style={s.body}>
            Bikes, autos and cabs across the city — at a fair price, with drivers who keep what they earn.
          </Text>

          <TouchableOpacity
            style={s.ctaBtn}
            onPress={() => router.push('/auth/phone')}
            activeOpacity={0.88}
          >
            <Text style={s.ctaBtnText}>Get started</Text>
            <ChevRightIcon />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/auth/phone')}
            style={s.loginRow}
            activeOpacity={0.7}
          >
            <Text style={s.loginText}>
              Already with us?{' '}
              <Text style={s.loginLink}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071633',
  },
  mapArea: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '58%',
    overflow: 'hidden',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingTop: 80,
    background: 'transparent',
  },
  content: {
    paddingHorizontal: 26,
    paddingBottom: 20,
    background: 'transparent',
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },
  wordmarkText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#EAF0FA',
    letterSpacing: -0.5,
  },
  headline: {
    fontSize: 40,
    fontWeight: '500',
    color: '#EAF0FA',
    lineHeight: 42,
    letterSpacing: -0.8,
    marginBottom: 14,
  },
  headlineAccent: {
    color: '#F7B32B',
    fontWeight: '600',
  },
  body: {
    fontSize: 15.5,
    lineHeight: 23,
    color: 'rgba(234,240,250,0.62)',
    marginBottom: 28,
    maxWidth: 310,
  },
  ctaBtn: {
    height: 56,
    backgroundColor: T.AMBER,
    borderRadius: T.R_MD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...T.SHADOW_AMBER,
    marginBottom: 18,
  },
  ctaBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: T.ON_AMBER,
  },
  loginRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginText: {
    fontSize: 14,
    color: 'rgba(234,240,250,0.62)',
  },
  loginLink: {
    color: T.AMBER,
    fontWeight: '600',
  },
});
