import React, { useMemo } from 'react';
import { StyleProp, Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { useTheme } from '@/theme';
import { TypographyVariant } from '@/theme/tokens';

type ColorToken =
  | 'text'
  | 'textSecondary'
  | 'textMuted'
  | 'textInverse'
  | 'accent'
  | 'danger'
  | 'dangerText'
  | 'success'
  | 'warning';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: ColorToken | string;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
};

const COLOR_TOKENS: ColorToken[] = [
  'text',
  'textSecondary',
  'textMuted',
  'textInverse',
  'accent',
  'danger',
  'dangerText',
  'success',
  'warning',
];

export function Text({
  variant = 'body',
  color = 'text',
  align,
  weight,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();

  const resolved = useMemo<StyleProp<TextStyle>>(() => {
    const resolvedColor = COLOR_TOKENS.includes(color as ColorToken)
      ? theme.colors[color as ColorToken]
      : (color as string);

    return [
      theme.typography[variant],
      { color: resolvedColor, fontFamily: theme.fontFamily },
      align ? { textAlign: align } : null,
      weight ? { fontWeight: weight } : null,
      style,
    ];
  }, [theme, variant, color, align, weight, style]);

  return <RNText style={resolved} {...rest} />;
}
