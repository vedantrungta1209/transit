import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Rect, Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { T } from '../src/lib/theme';

const { width, height } = Dimensions.get('window');

function MapBackground() {
  const ink = '#0A1C40';
  const road = '#16264a';
  const park = '#10305a';
  const w = width;
  const h = height * 0.55;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill}>
      <Rect width={w} height={h} fill={ink} />
      <Circle cx="310" cy={h - 100} r="65" fill={park} opacity="0.7" />
      <Rect x="20" y="110" width="110" height="80" rx="10" fill={park} opacity="0.6" />
      <Path d={`M-20 ${h * 0.32} L${w + 20} ${h * 0.45}`} stroke={road} strokeWidth="13" strokeLinecap="round" opacity="0.9" />
      <Path d={`M-20 ${h * 0.68} L${w + 20} ${h * 0.6}`} stroke={road} strokeWidth="13" strokeLinecap="round" opacity="0.9" />
      <Path d={`M${w * 0.2} -20 L${w * 0.28} ${h + 20}`} stroke={road} strokeWidth="13" strokeLinecap="round" opacity="0.9" />
      <Path d={`M${w * 0.62} -20 L${w * 0.7} ${h + 20}`} stroke={road} strokeWidth="13" strokeLinecap="round" opacity="0.9" />
      <Path d={`M${w * 0.44} -20 L${w * 0.48} ${h + 20}`} stroke={road} strokeWidth="6" strokeLinecap="round" opacity="0.75" />
      {/* Route line */}
      <Path
        d={`M${w * 0.28} ${h * 0.88} C${w * 0.38} ${h * 0.72} ${w * 0.48} ${h * 0.65} ${w * 0.5} ${h * 0.52} C${w * 0.52} ${h * 0.38} ${w * 0.58} ${h * 0.32} ${w * 0.65} ${h * 0.13}`}
        fill="none" stroke="#F7B32B" strokeWidth="5" strokeLinecap="round"
      />
      {/* Driver car marker */}
      <Circle cx={w * 0.46} cy={h * 0.5} r="22" fill="#F7B32B" />
      <Circle cx={w * 0.46} cy={h * 0.5} r="16" fill="#0F2B5B" />
      <Path d={`M${w * 0.46 - 5} ${h * 0.5 - 6} L${w * 0.46} ${h * 0.5 + 6} L${w * 0.46 + 5} ${h * 0.5 - 6}`} fill="#F7B32B" />
    </Svg>
  );
}

function TransitIcon({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="bg2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#16356A" />
          <Stop offset="1" stopColor="#0A1C40" />
        </LinearGradient>
      </Defs>
      <Rect x="6" y="6" width="108" height="108" rx="28" fill="url(#bg2)" />
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
      <View style={s.mapArea}>
        <MapBackground />
      </View>

      <View style={s.bottomGradient}>
        <SafeAreaView edges={['bottom']} style={s.content}>
          <View style={s.wordmark}>
            <TransitIcon size={44} />
            <View>
              <Text style={s.wordmarkText}>Transit</Text>
              <Text style={s.wordmarkSub}>Driver</Text>
            </View>
          </View>

          <Text style={s.headline}>
            Drive. Earn.{'\n'}
            <Text style={s.headlineAccent}>Freedom.</Text>
          </Text>

          <Text style={s.body}>
            Zero commission — keep every fare you earn. Flat subscription, first 3 months free.
          </Text>

          {/* Highlights */}
          <View style={s.highlights}>
            {[
              { label: '₹0 commission', sub: 'You keep 100% of fares' },
              { label: 'Free 3 months', sub: 'Then ₹299/month' },
            ].map((h, i) => (
              <View key={i} style={s.highlightChip}>
                <Text style={s.highlightLabel}>{h.label}</Text>
                <Text style={s.highlightSub}>{h.sub}</Text>
              </View>
            ))}
          </View>

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
              Already a driver?{' '}
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
    height: '55%',
    overflow: 'hidden',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingTop: 70,
  },
  content: {
    paddingHorizontal: 26,
    paddingBottom: 20,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  wordmarkText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#EAF0FA',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  wordmarkSub: {
    fontSize: 13,
    fontWeight: '600',
    color: T.AMBER,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  headline: {
    fontSize: 38,
    fontWeight: '500',
    color: '#EAF0FA',
    lineHeight: 40,
    letterSpacing: -0.8,
    marginBottom: 14,
  },
  headlineAccent: {
    color: '#F7B32B',
    fontWeight: '600',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(234,240,250,0.62)',
    marginBottom: 20,
    maxWidth: 300,
  },
  highlights: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  highlightChip: {
    flex: 1,
    backgroundColor: 'rgba(247,179,43,0.14)',
    borderRadius: T.R_SM,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(247,179,43,0.4)',
  },
  highlightLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: T.AMBER,
  },
  highlightSub: {
    fontSize: 11.5,
    color: 'rgba(234,240,250,0.62)',
    marginTop: 2,
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
