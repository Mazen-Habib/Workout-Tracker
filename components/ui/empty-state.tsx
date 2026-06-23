import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles, useTheme } from '@/theme';
import { Appear } from './fade-in';
import { Text } from './text';

export type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
};

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Appear scaleFrom={0.8} translateFrom={0} style={styles.iconCircle}>
        <Ionicons name={icon} size={36} color={theme.colors.textMuted} />
      </Appear>
      <Text variant="subheading" align="center" style={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" color="textSecondary" align="center" style={styles.description}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: t.spacing['3xl'],
    minHeight: 360,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: t.spacing.lg,
  },
  title: {
    marginBottom: t.spacing.xs,
  },
  description: {
    maxWidth: 300,
  },
}));
