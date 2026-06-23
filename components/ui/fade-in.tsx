import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { durations, springs } from '@/theme/tokens';

export type FadeInProps = {
  children: React.ReactNode;
  /** Delay before the entrance starts (ms). Use index * step for staggered lists. */
  delay?: number;
  /** Vertical travel distance for the entrance (px). */
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Fade + slide-up entrance. Replays every time the host screen regains focus
 * (screens stay mounted in tab/stack navigators, so a plain mount effect would
 * only ever run once).
 */
export function FadeIn({
  children,
  delay = 0,
  distance = 12,
  duration = durations.base,
  style,
}: FadeInProps) {
  const isFocused = useIsFocused();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isFocused) {
      progress.value = withDelay(delay, withTiming(1, { duration }));
    } else {
      // Reset while off-screen so the next focus animates cleanly (no flash).
      progress.value = 0;
    }
  }, [isFocused, delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

export type AppearProps = {
  children: React.ReactNode;
  scaleFrom?: number;
  translateFrom?: number;
  spring?: { damping: number; stiffness: number; mass: number };
  style?: StyleProp<ViewStyle>;
};

/** Spring scale + fade entrance — for emphasis elements (FAB, dialogs, icons). */
export function Appear({
  children,
  scaleFrom = 0.92,
  translateFrom = 12,
  spring = springs.gentle,
  style,
}: AppearProps) {
  const isFocused = useIsFocused();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isFocused) {
      progress.value = withSpring(1, spring);
    } else {
      progress.value = 0;
    }
  }, [isFocused, spring, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p,
      transform: [{ scale: scaleFrom + (1 - scaleFrom) * p }, { translateY: (1 - p) * translateFrom }],
    };
  });

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

/** Convenience for staggering a list: returns delay for the given index. */
export const stagger = (index: number, step = 55, base = 0) => base + index * step;
