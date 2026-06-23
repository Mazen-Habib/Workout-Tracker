import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles, useTheme } from '@/theme';
import { PressableScale } from './pressable-scale';

export type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  variant?: 'plain' | 'soft' | 'surface';
  disabled?: boolean;
  haptic?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  onPress,
  size = 22,
  color,
  variant = 'soft',
  disabled,
  haptic = true,
  accessibilityLabel,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const styles = useStyles();
  const tint = color ?? theme.colors.accent;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic={haptic}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        variant === 'soft' && styles.soft,
        variant === 'surface' && styles.surface,
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={tint} />
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    width: 40,
    height: 40,
    borderRadius: t.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soft: {
    backgroundColor: t.colors.accentSoft,
    borderWidth: 1,
    borderColor: t.colors.accentBorder,
  },
  surface: {
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
}));
