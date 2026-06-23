import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import {
  Card,
  EmptyState,
  FadeIn,
  Screen,
  SectionHeader,
  StatCard,
  Text,
  stagger,
} from '@/components/ui';
import { makeStyles, useTheme } from '@/theme';
import { Workout } from '../types/workout';
import {
  getPersonalRecords,
  getTotalExercises,
  getTotalVolume,
  getUniqueExercises,
  getWorkoutsByWeek,
} from '../utils/stats';
import { loadWorkouts } from '../utils/storage';

const screenWidth = Dimensions.get('window').width;

// Convert a #rrggbb hex to an rgba() string for chart-kit opacity callbacks.
const hexToRgba = (hex: string, opacity: number) => {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function ProgressScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorkoutsData = useCallback(async () => {
    try {
      setWorkouts(await loadWorkouts());
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkoutsData();
    }, [loadWorkoutsData])
  );

  const totalWorkouts = workouts.length;
  const totalExercises = useMemo(() => getTotalExercises(workouts), [workouts]);
  const totalVolume = useMemo(() => getTotalVolume(workouts), [workouts]);
  const uniqueExercises = useMemo(() => getUniqueExercises(workouts), [workouts]);
  const personalRecords = useMemo(() => getPersonalRecords(workouts), [workouts]);
  const weeklyWorkouts = useMemo(() => getWorkoutsByWeek(workouts), [workouts]);

  const volumeLabel = totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : `${totalVolume}`;

  if (!loading && workouts.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="stats-chart-outline"
          title="No Progress Data Yet"
          description="Complete some workouts to see your progress."
        />
      </Screen>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => hexToRgba(theme.colors.accent, opacity),
    labelColor: (opacity = 1) => hexToRgba(theme.colors.textSecondary, opacity),
    barPercentage: 0.6,
    propsForBackgroundLines: { stroke: theme.colors.border },
    propsForLabels: { fontSize: 12 },
  };

  return (
    <Screen scroll edgeBottom contentContainerStyle={styles.content}>
      <FadeIn>
        <Text variant="title">Progress</Text>
        <Text variant="body" color="textSecondary" style={styles.subtitle}>
          Keep crushing it 💪
        </Text>
      </FadeIn>

      <FadeIn delay={stagger(1)}>
        <View style={styles.statsRow}>
          <StatCard icon="barbell-outline" value={totalWorkouts} label="Workouts" />
          <StatCard icon="fitness-outline" value={totalExercises} label="Exercises" />
        </View>
      </FadeIn>

      <FadeIn delay={stagger(2)}>
        <View style={styles.statsRow}>
          <StatCard icon="trophy-outline" value={uniqueExercises.length} label="Unique Exercises" />
          <StatCard icon="flame-outline" value={volumeLabel} label="Volume (kg)" />
        </View>
      </FadeIn>

      <FadeIn delay={stagger(3)}>
        <Card style={styles.chartCard}>
          <Text variant="overline" color="textSecondary">Workout Frequency</Text>
          <Text variant="caption" color="textMuted" style={styles.chartSub}>Last 4 weeks</Text>
          <BarChart
            data={{
              labels: ['W1', 'W2', 'W3', 'W4'],
              datasets: [{ data: weeklyWorkouts }],
            }}
            width={screenWidth - theme.spacing.xl * 2 - theme.spacing.lg * 2}
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero
            chartConfig={chartConfig}
            style={styles.chart}
            withInnerLines
          />
        </Card>
      </FadeIn>

      {personalRecords.length > 0 ? (
        <FadeIn delay={stagger(4)}>
          <View style={styles.recordsSection}>
            <SectionHeader title="Personal Records 🏆" />
            {personalRecords.map((record, index) => (
              <FadeIn key={`${record.name}-${index}`} delay={stagger(index, 50, 40)}>
                <Card style={styles.recordCard}>
                  <View style={styles.recordRank}>
                    <Text variant="bodyStrong" color={theme.colors.accentText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text variant="bodyStrong" numberOfLines={1}>{record.name}</Text>
                    <Text variant="caption" color="accent">{record.weight} kg</Text>
                  </View>
                </Card>
              </FadeIn>
            ))}
          </View>
        </FadeIn>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  content: {
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing['2xl'],
    paddingBottom: t.spacing.xl,
  },
  flex: { flex: 1 },
  subtitle: {
    marginTop: t.spacing.xs,
    marginBottom: t.spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: t.spacing.md,
    marginBottom: t.spacing.md,
  },
  chartCard: {
    marginTop: t.spacing.sm,
    marginBottom: t.spacing.xl,
  },
  chartSub: {
    marginTop: 2,
    marginBottom: t.spacing.md,
  },
  chart: {
    marginLeft: -t.spacing.sm,
    borderRadius: t.radius.md,
  },
  recordsSection: {
    marginTop: t.spacing.xs,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    marginBottom: t.spacing.md,
  },
  recordRank: {
    width: 40,
    height: 40,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
