import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { makeStyles } from '@/theme';
import { PressableScale, PressableScaleProps } from './pressable-scale';

type CardVariant = 'elevated' | 'outlined' | 'muted';

type CommonProps = {
  children: React.ReactNode;
  variant?: CardVariant;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

type StaticCardProps = CommonProps & { onPress?: undefined };
type PressableCardProps = CommonProps &
  Omit<PressableScaleProps, 'style' | 'children'> & { onPress: () => void };

export function Card(props: StaticCardProps | PressableCardProps) {
  const styles = useStyles();
  const { children, variant = 'elevated', padded = true, style } = props;

  const variantStyle = [
    styles.base,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    variant === 'muted' && styles.muted,
    padded && styles.padded,
    style,
  ];

  if ('onPress' in props && props.onPress) {
    const { onPress, variant: _v, padded: _p, style: _s, children: _c, ...rest } = props;
    return (
      <PressableScale onPress={onPress} style={variantStyle} {...rest}>
        {children}
      </PressableScale>
    );
  }

  return <View style={variantStyle}>{children}</View>;
}

const useStyles = makeStyles((t) => ({
  base: {
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
  },
  padded: {
    padding: t.spacing.lg,
  },
  elevated: {
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    ...t.shadow.sm,
  },
  outlined: {
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  muted: {
    backgroundColor: t.colors.surfaceMuted,
  },
}));
