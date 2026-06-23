import React from 'react';
import { ScrollView, ScrollViewProps, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

type BaseProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Apply top safe-area padding (use on screens without a native header). */
  edgeTop?: boolean;
  /** Apply bottom safe-area padding. */
  edgeBottom?: boolean;
  background?: 'background' | 'surface';
};

type ScreenProps = BaseProps & {
  scroll?: false;
};

type ScrollScreenProps = BaseProps &
  Omit<ScrollViewProps, 'style'> & {
    scroll: true;
    contentContainerStyle?: StyleProp<ViewStyle>;
  };

/** Themed page container with safe-area handling and optional scrolling. */
export function Screen(props: ScreenProps | ScrollScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { children, style, edgeTop, edgeBottom, background = 'background' } = props;

  const bg = theme.colors[background];
  const padding: ViewStyle = {
    paddingTop: edgeTop ? insets.top : 0,
    paddingBottom: edgeBottom ? insets.bottom : 0,
  };

  if (props.scroll) {
    const { contentContainerStyle, ...rest } = props as ScrollScreenProps;
    return (
      <ScrollView
        style={[{ flex: 1, backgroundColor: bg }, style]}
        contentContainerStyle={[padding, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...stripBase(rest)}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[{ flex: 1, backgroundColor: bg }, padding, style]}>{children}</View>;
}

// Avoid forwarding our custom props to the underlying ScrollView.
function stripBase(props: any) {
  const { children, style, edgeTop, edgeBottom, background, scroll, ...rest } = props;
  return rest;
}
