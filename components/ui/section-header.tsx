import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { makeStyles } from '@/theme';
import { PressableScale } from './pressable-scale';
import { Text } from './text';

export type SectionHeaderProps = {
  title: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({ title, action, style }: SectionHeaderProps) {
  const styles = useStyles();
  return (
    <View style={[styles.container, style]}>
      <Text variant="heading">{title}</Text>
      {action ? (
        <PressableScale onPress={action.onPress} hitSlop={8}>
          <Text variant="bodyStrong" color="accent">
            {action.label}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: t.spacing.md,
  },
}));
