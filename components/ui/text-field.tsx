import React, { forwardRef } from 'react';
import { StyleProp, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import { Text } from './text';

export type TextFieldProps = TextInputProps & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, containerStyle, style, multiline, ...rest },
  ref
) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="label" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, multiline && styles.multiline, style]}
        multiline={multiline}
        {...rest}
      />
    </View>
  );
});

const useStyles = makeStyles((t) => ({
  label: {
    marginBottom: t.spacing.xs,
  },
  input: {
    backgroundColor: t.colors.surfaceMuted,
    borderColor: t.colors.border,
    borderWidth: 1,
    borderRadius: t.radius.md,
    paddingVertical: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    color: t.colors.text,
    fontSize: 16,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: t.spacing.md,
  },
}));
