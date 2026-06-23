import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  AppDialog,
  Card,
  EmptyState,
  FadeIn,
  PressableScale,
  Screen,
  Text,
  stagger,
} from '@/components/ui';
import { useAppDialog } from '@/hooks/use-app-dialog';
import { makeStyles, useTheme } from '@/theme';
import { ExerciseSet, Workout, WorkoutExercise } from './types/workout';
import { deleteExerciseFromWorkout, loadWorkouts } from './utils/storage';

interface ExerciseHistoryItem {
  workout: Workout;
  exercise: WorkoutExercise;
}

export default function ExerciseHistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const styles = useStyles();
  const dialog = useAppDialog();
  const { exerciseId, exerciseName } = useLocalSearchParams<{ exerciseId: string; exerciseName: string }>();

  const [historyItems, setHistoryItems] = useState<ExerciseHistoryItem[]>([]);

  const normalizedExerciseName = useMemo(
    () => (Array.isArray(exerciseName) ? exerciseName[0] ?? 'Exercise' : exerciseName || 'Exercise'),
    [exerciseName]
  );
  const normalizedExerciseId = useMemo(
    () => (Array.isArray(exerciseId) ? exerciseId[0] ?? '' : exerciseId || ''),
    [exerciseId]
  );

  const loadHistory = useCallback(async () => {
    try {
      const workouts = await loadWorkouts();
      const mapped = workouts
        .filter((workout) => workout.exercises.some((e) => e.exerciseId === normalizedExerciseId))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((workout) => {
          const exercise = workout.exercises.find((item) => item.exerciseId === normalizedExerciseId);
          return exercise ? { workout, exercise } : null;
        })
        .filter((item): item is ExerciseHistoryItem => item !== null);
      setHistoryItems(mapped);
    } catch (error) {
      console.error('Error loading exercise history:', error);
      setHistoryItems([]);
    }
  }, [normalizedExerciseId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDeleteHistoryEntry = (workout: Workout) => {
    dialog.confirm({
      title: 'Delete History Entry',
      message: `Delete ${normalizedExerciseName} from ${format(new Date(workout.date), 'MMM d, yyyy')}?`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteExerciseFromWorkout(workout.id, normalizedExerciseId);
          await loadHistory();
        } catch {
          dialog.alert('Error', 'Failed to delete exercise history entry');
        }
      },
    });
  };

  const getValidSets = (exercise: WorkoutExercise): ExerciseSet[] =>
    Array.isArray(exercise.sets)
      ? exercise.sets.filter((set) => typeof set.reps === 'number' && (typeof set.weight === 'number' || set.weight === null))
      : [];

  const getTotalVolume = (sets: ExerciseSet[]): number =>
    sets.reduce((sum, set) => sum + (typeof set.weight === 'number' ? set.reps * set.weight : 0), 0);

  return (
    <Screen scroll edgeBottom contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: `${normalizedExerciseName} History` }} />

      {historyItems.length === 0 ? (
        <EmptyState
          icon="bar-chart-outline"
          title="No history yet"
          description="Complete your first workout with this exercise."
        />
      ) : (
        historyItems.map(({ workout, exercise }, index) => {
          const sets = getValidSets(exercise);
          const totalVolume = getTotalVolume(sets);
          return (
            <FadeIn key={workout.id} delay={stagger(Math.min(index, 6))}>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text variant="subheading">{format(new Date(workout.date), 'EEE, MMM d, yyyy')}</Text>
                  <View style={styles.cardActions}>
                    <PressableScale
                      onPress={() => router.push({ pathname: '/edit-workout', params: { workoutId: workout.id } })}
                      hitSlop={8}
                    >
                      <Ionicons name="create-outline" size={20} color={theme.colors.accent} />
                    </PressableScale>
                    <PressableScale onPress={() => handleDeleteHistoryEntry(workout)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                    </PressableScale>
                  </View>
                </View>
                <View style={styles.sets}>
                  {sets.length === 0 ? (
                    <Text variant="caption" color="textMuted">No sets recorded</Text>
                  ) : (
                    sets.map((set, setIndex) => (
                      <Text key={set.id} variant="caption" color="textSecondary">
                        Set {setIndex + 1}: {typeof set.weight === 'number' ? `${set.reps} reps · ${set.weight} kg` : `${set.reps} reps`}
                      </Text>
                    ))
                  )}
                </View>
                <Text variant="label" color="accent">
                  Total Volume: {totalVolume.toLocaleString()} kg
                </Text>
              </Card>
            </FadeIn>
          );
        })
      )}

      <AppDialog {...dialog.props} />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  content: {
    padding: t.spacing.xl,
    flexGrow: 1,
  },
  card: {
    marginBottom: t.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.lg,
  },
  sets: {
    marginTop: t.spacing.md,
    marginBottom: t.spacing.md,
    gap: t.spacing.xs,
  },
}));
