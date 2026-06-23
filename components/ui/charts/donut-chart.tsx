import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
  SharedValue,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { makeStyles, useTheme } from '@/theme';
import { Text } from '../text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type DonutSlice = { label: string; value: number; color: string };

export type DonutChartProps = {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerValue?: string | number;
  centerLabel?: string;
};

function Slice({
  startFraction,
  fraction,
  color,
  size,
  strokeWidth,
  progress,
}: {
  startFraction: number;
  fraction: number;
  color: string;
  size: number;
  strokeWidth: number;
  progress: SharedValue<number>;
}) {
  const c = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  // Animate the numeric strokeDashoffset (reliable across reanimated + svg).
  // strokeDasharray is static = full circumference; offset reveals the arc.
  const animatedProps = useAnimatedProps(() => {
    const drawn = Math.min(Math.max(progress.value - startFraction, 0), fraction);
    return { strokeDashoffset: circumference * (1 - drawn) };
  });

  return (
    <AnimatedCircle
      cx={c}
      cy={c}
      r={r}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="butt"
      strokeDasharray={circumference}
      rotation={startFraction * 360 - 90}
      originX={c}
      originY={c}
      animatedProps={animatedProps}
    />
  );
}

export function DonutChart({ data, size = 168, strokeWidth = 26, centerValue, centerLabel }: DonutChartProps) {
  const theme = useTheme();
  const styles = useStyles();
  const isFocused = useIsFocused();
  const progress = useSharedValue(0);

  const { slices, total } = useMemo(() => {
    const sum = data.reduce((acc, d) => acc + d.value, 0) || 1;
    let cursor = 0;
    const computed = data.map((d) => {
      const fraction = d.value / sum;
      const slice = { ...d, startFraction: cursor, fraction };
      cursor += fraction;
      return slice;
    });
    return { slices: computed, total: sum };
  }, [data]);

  useEffect(() => {
    if (isFocused) {
      progress.value = 0;
      progress.value = withDelay(150, withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }));
    } else {
      progress.value = 0;
    }
  }, [isFocused, data, progress]);

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={(size - strokeWidth) / 2}
            stroke={theme.colors.surfaceMuted}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {slices.map((slice, i) => (
            <Slice
              key={`${slice.label}-${i}`}
              startFraction={slice.startFraction}
              fraction={slice.fraction}
              color={slice.color}
              size={size}
              strokeWidth={strokeWidth}
              progress={progress}
            />
          ))}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          {centerValue !== undefined ? <Text variant="heading">{centerValue}</Text> : null}
          {centerLabel ? (
            <Text variant="caption" color="textMuted">{centerLabel}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.legend}>
        {slices.map((slice, i) => (
          <View key={`${slice.label}-legend-${i}`} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: slice.color }]} />
            <Text variant="label" numberOfLines={1} style={styles.legendLabel}>
              {slice.label}
            </Text>
            <Text variant="caption" color="textMuted">
              {Math.round((slice.value / total) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xl,
  },
  center: {
    ...StyleSheetAbsoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flex: 1,
    gap: t.spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
  },
}));

const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
