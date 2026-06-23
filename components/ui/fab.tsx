import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles, useTheme } from '@/theme';
import { springs } from '@/theme/tokens';
import { Appear } from './fade-in';
import { PressableScale } from './pressable-scale';

export type FabProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Floating action button with a spring entrance. */
export function Fab({ icon = 'add', onPress, style, accessibilityLabel }: FabProps) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <Appear scaleFrom={0.6} spring={springs.pop} style={[styles.wrapper, style]}>
      <PressableScale
        onPress={onPress}
        haptic
        scaleTo={0.9}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? 'Add'}
        style={styles.fab}
      >
        <Ionicons name={icon} size={28} color={theme.colors.accentText} />
      </PressableScale>
    </Appear>
  );
}

const useStyles = makeStyles((t) => ({
  wrapper: {
    position: 'absolute',
    right: t.spacing.xl,
    bottom: t.spacing.xl,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...t.shadow.lg,
  },
}));
