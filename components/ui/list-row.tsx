import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles, useTheme } from '@/theme';
import { Card } from './card';
import { Text } from './text';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Override the default leading icon tile with custom content. */
  leading?: React.ReactNode;
  /** Override the trailing chevron. */
  trailing?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  titleAlign?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
};

/** Tappable card row — the workhorse for library navigation lists. */
export function ListRow({
  title,
  subtitle,
  icon,
  leading,
  trailing,
  onPress,
  onLongPress,
  titleAlign = 'left',
  style,
}: ListRowProps) {
  const theme = useTheme();
  const styles = useStyles();

  const content = (
    <View style={styles.row}>
      {leading ?? (icon ? (
        <View style={styles.iconTile}>
          <Ionicons name={icon} size={22} color={theme.colors.accent} />
        </View>
      ) : null)}
      <View style={styles.textWrap}>
        <Text variant="subheading" align={titleAlign} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textSecondary" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
      )}
    </View>
  );

  if (onPress || onLongPress) {
    return (
      <Card
        variant="elevated"
        onPress={onPress ?? (() => {})}
        onLongPress={onLongPress}
        delayLongPress={300}
        haptic
        style={[styles.card, style]}
      >
        {content}
      </Card>
    );
  }

  return (
    <Card variant="elevated" style={[styles.card, style]}>
      {content}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    marginBottom: t.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
}));
