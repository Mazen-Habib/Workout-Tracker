import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Text } from './text';

const { width, height } = Dimensions.get('window');

export type CelebrationVariant = 'complete' | 'pr';

type CelebrationProps = {
  variant: CelebrationVariant;
  onDone: () => void;
};

function Confetti({
  color,
  originX,
  originY,
  spread,
}: {
  color: string;
  originX: number;
  originY: number;
  spread: number;
}) {
  const t = useSharedValue(0);

  // Random launch vector + spin, computed once.
  const { dx, dy, rot, size, duration } = useMemo(() => {
    const angle = Math.random() * Math.PI * 2;
    const dist = spread * (0.5 + Math.random() * 0.7);
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      rot: Math.random() * 720 - 360,
      size: 6 + Math.random() * 6,
      duration: 850 + Math.random() * 550,
    };
  }, [spread]);

  useEffect(() => {
    t.value = withTiming(1, { duration, easing: Easing.out(Easing.quad) });
  }, [t, duration]);

  const style = useAnimatedStyle(() => {
    const p = t.value;
    return {
      opacity: p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3,
      transform: [
        { translateX: dx * p },
        { translateY: dy * p + 240 * p * p }, // gravity
        { rotate: `${rot * p}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: originX,
          top: originY,
          width: size,
          height: size * 0.6,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function Celebration({ variant, onDone }: CelebrationProps) {
  const theme = useTheme();
  const isPr = variant === 'pr';
  const count = isPr ? 32 : 18;
  const spread = isPr ? 280 : 180;
  const originX = width / 2;
  const originY = height * 0.4;

  const colors = isPr
    ? ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', theme.colors.accent]
    : theme.colors.chart;

  const badge = useSharedValue(0);

  useEffect(() => {
    badge.value = withSequence(
      withSpring(1, isPr ? { damping: 8, stiffness: 180, mass: 0.8 } : { damping: 14, stiffness: 280, mass: 0.55 }),
      withDelay(
        isPr ? 950 : 180,
        withTiming(0, { duration: isPr ? 240 : 200 }, (finished) => {
          if (finished) runOnJS(onDone)();
        })
      )
    );
  }, [badge, isPr, onDone]);

  const particles = useMemo(() => Array.from({ length: count }), [count]);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(badge.value, 0), 1),
    transform: [{ scale: 0.5 + badge.value * 0.5 }],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((_, i) => (
        <Confetti key={i} color={colors[i % colors.length]} originX={originX} originY={originY} spread={spread} />
      ))}

      <Animated.View style={[styles.badgeWrap, { top: originY - 70 }, badgeStyle]}>
        <View
          style={[
            styles.badge,
            { backgroundColor: isPr ? '#F59E0B' : theme.colors.accent },
            isPr ? styles.badgePr : null,
          ]}
        >
          <Ionicons name={isPr ? 'trophy' : 'checkmark'} size={isPr ? 44 : 40} color="#fff" />
        </View>
        <Text variant={isPr ? 'heading' : 'subheading'} style={styles.label}>
          {isPr ? 'New PR!' : 'Logged!'}
        </Text>
        {isPr ? (
          <Text variant="caption" color="textSecondary">
            Personal best 🎉
          </Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  badgePr: {
    shadowColor: '#F59E0B',
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  label: {
    marginTop: 14,
  },
});
