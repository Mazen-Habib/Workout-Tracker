import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop, Text as SvgText, Circle } from 'react-native-svg';
import { useTheme } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Point = { x: number; y: number };

export type LineChartProps = {
  data: number[];
  labels: string[];
  height?: number;
  color?: string;
  /** Suffix shown is up to caller; this just draws values. */
};

const TOP_PAD = 12;
const BOTTOM_PAD = 24; // room for x labels
const H_PAD = 8;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

// Catmull-Rom → cubic bezier smoothing for a clean curve. Control-point Y is
// clamped to [minY, maxY] so the curve can't overshoot below the baseline.
const buildSmoothPath = (pts: Point[], minY: number, maxY: number): string => {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = clamp(p1.y + (p2.y - p0.y) / 6, minY, maxY);
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = clamp(p2.y - (p3.y - p1.y) / 6, minY, maxY);
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
};

const pathLength = (pts: Point[]): number => {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return Math.max(len, 1) * 1.15; // buffer for curve overshoot
};

export function LineChart({ data, labels, height = 170, color }: LineChartProps) {
  const theme = useTheme();
  const isFocused = useIsFocused();
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);

  const stroke = color ?? theme.colors.accent;
  const gradientId = 'lineAreaGradient';

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const { points, linePath, areaPath, totalLen } = useMemo(() => {
    if (width === 0 || data.length === 0) {
      return { points: [] as Point[], linePath: '', areaPath: '', totalLen: 1 };
    }
    const chartH = height - TOP_PAD - BOTTOM_PAD;
    const innerW = width - H_PAD * 2;
    const max = Math.max(...data, 1);
    const n = data.length;
    const baseline = TOP_PAD + chartH;
    const pts: Point[] = data.map((v, i) => ({
      x: H_PAD + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW),
      y: TOP_PAD + chartH * (1 - v / max),
    }));
    const line = buildSmoothPath(pts, TOP_PAD, baseline);
    const area = `${line} L ${pts[pts.length - 1].x} ${baseline} L ${pts[0].x} ${baseline} Z`;
    return { points: pts, linePath: line, areaPath: area, totalLen: pathLength(pts) };
  }, [width, data, height]);

  useEffect(() => {
    if (isFocused && width > 0) {
      progress.value = 0;
      progress.value = withDelay(120, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
    } else {
      progress.value = 0;
    }
  }, [isFocused, width, data, progress]);

  const lineAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: totalLen * (1 - progress.value),
  }));

  const areaAnimatedProps = useAnimatedProps(() => ({
    fillOpacity: progress.value,
  }));

  return (
    <View onLayout={onLayout} style={{ width: '100%', height }}>
      {width > 0 && points.length > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={stroke} stopOpacity={0.32} />
              <Stop offset="1" stopColor={stroke} stopOpacity={0} />
            </LinearGradient>
            <ClipPath id="plotClip">
              <Rect x={0} y={0} width={width} height={height - BOTTOM_PAD + 1} />
            </ClipPath>
          </Defs>

          {/* Clip everything to the plot area so smoothing can't dip below the baseline */}
          <G clipPath="url(#plotClip)">
            {/* Area fill */}
            <AnimatedPath d={areaPath} fill={`url(#${gradientId})`} animatedProps={areaAnimatedProps} />

            {/* Animated line draw */}
            <AnimatedPath
              d={linePath}
              stroke={stroke}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={totalLen}
              animatedProps={lineAnimatedProps}
            />

            {/* End dot */}
            <Circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4} fill={stroke} />
          </G>

          {/* X labels */}
          {labels.map((label, i) => (
            <SvgText
              key={`${label}-${i}`}
              x={points[i]?.x ?? 0}
              y={height - 6}
              fontSize={11}
              fill={theme.colors.textMuted}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          ))}
        </Svg>
      ) : null}
    </View>
  );
}
