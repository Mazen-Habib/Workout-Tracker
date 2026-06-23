import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles, useTheme } from '@/theme';
import { Card } from './card';
import { Text } from './text';

export type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  tint?: string;
  style?: StyleProp<ViewStyle>;
};

/** Compact metric tile used on dashboards and the progress screen. */
export function StatCard({ icon, value, label, tint, style }: StatCardProps) {
  const theme = useTheme();
  const styles = useStyles();
  const accent = tint ?? theme.colors.accent;

  return (
    <Card variant="elevated" style={[styles.card, style]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.accentSoft }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text variant="title" style={styles.value}>
        {value}
      </Text>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {label}
      </Text>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    flex: 1,
    gap: t.spacing.xs,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: t.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: t.spacing.sm,
  },
  value: {
    marginTop: t.spacing.xs,
  },
}));
