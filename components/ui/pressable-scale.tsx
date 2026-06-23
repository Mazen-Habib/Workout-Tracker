import React, { useCallback } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { springs } from '@/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = PressableProps & {
  /** How far to scale down on press. */
  scaleTo?: number;
  /** Fire a light haptic on press-in. */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A Pressable with a springy press-in scale — the baseline "premium tap"
 * interaction used across cards, buttons and rows.
 */
export function PressableScale({
  scaleTo = 0.97,
  haptic = false,
  disabled,
  onPressIn,
  onPressOut,
  style,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (e) => {
      scale.value = withSpring(scaleTo, springs.press);
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      onPressIn?.(e);
    },
    [scale, scaleTo, haptic, onPressIn]
  );

  const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (e) => {
      scale.value = withSpring(1, springs.press);
      onPressOut?.(e);
    },
    [scale, onPressOut]
  );

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style, disabled ? { opacity: 0.5 } : null]}
      {...rest}
    >
      {children as React.ReactNode}
    </AnimatedPressable>
  );
}
