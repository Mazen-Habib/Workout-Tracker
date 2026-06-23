import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import {
  AppDialog,
  Card,
  EmptyState,
  FadeIn,
  PressableScale,
  Screen,
  SectionHeader,
  Text,
  stagger,
} from '@/components/ui';
import { useAppDialog } from '@/hooks/use-app-dialog';
import { makeStyles, useTheme } from '@/theme';
import { Workout } from '../types/workout';
import { clearAllWorkouts, deleteWorkout, loadWorkouts } from '../utils/storage';

export default function HistoryScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles();
  const dialog = useAppDialog();
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

  const handleDeleteWorkout = (id: string, date: string) => {
    dialog.confirm({
      title: 'Delete Workout',
      message: `Delete workout from ${format(new Date(date), 'MMM d, yyyy')}?`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteWorkout(id);
          await loadWorkoutsData();
        } catch {
          dialog.alert('Error', 'Failed to delete workout');
        }
      },
    });
  };

  const handleClearAll = () => {
    dialog.confirm({
      title: 'Clear All History',
      message: 'This will permanently delete all workout history. Are you sure?',
      confirmLabel: 'Clear All',
      destructive: true,
      onConfirm: async () => {
        try {
          await clearAllWorkouts();
          await loadWorkoutsData();
        } catch {
          dialog.alert('Error', 'Failed to clear workout history');
        }
      },
    });
  };

  const selectedWorkoutId = Array.isArray(workoutId) ? workoutId[0] : workoutId;
  const displayWorkouts = selectedWorkoutId
    ? [
        ...workouts.filter((item) => item.id === selectedWorkoutId),
        ...workouts.filter((item) => item.id !== selectedWorkoutId),
      ]
    : workouts;

  if (!loading && workouts.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="barbell-outline"
          title="No Workouts Yet"
          description="Start logging your workouts to see them here."
        />
      </Screen>
    );
  }

  return (
    <Screen scroll edgeBottom contentContainerStyle={styles.content}>
      <FadeIn>
        <SectionHeader
          title="History"
          action={workouts.length > 0 ? { label: 'Clear all', onPress: handleClearAll } : undefined}
          style={styles.header}
        />
        <Text variant="caption" color="textSecondary" style={styles.subtitle}>
          {workouts.length} total workout{workouts.length === 1 ? '' : 's'}
        </Text>
      </FadeIn>

      {displayWorkouts.map((workout, index) => {
        const selected = selectedWorkoutId === workout.id;
        return (
          <FadeIn key={workout.id} delay={stagger(Math.min(index, 6))}>
            <Card style={[styles.card, selected && styles.cardSelected]}>
              <View style={styles.cardHeader}>
                <View style={styles.flex}>
                  <Text variant="subheading">{format(new Date(workout.date), 'EEE, MMM d, yyyy')}</Text>
                  <Text variant="caption" color="textMuted">{format(new Date(workout.date), 'h:mm a')}</Text>
                </View>
                <View style={styles.cardActions}>
                  <PressableScale
                    onPress={() => router.push({ pathname: '/edit-workout', params: { workoutId: workout.id } })}
                    hitSlop={8}
                  >
                    <Ionicons name="create-outline" size={20} color={theme.colors.accent} />
                  </PressableScale>
                  <PressableScale onPress={() => handleDeleteWorkout(workout.id, workout.date)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                  </PressableScale>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="fitness-outline" size={15} color={theme.colors.accent} />
                  <Text variant="caption" color="textSecondary">
                    {workout.exercises.length} exercise{workout.exercises.length === 1 ? '' : 's'}
                  </Text>
                </View>
                {typeof workout.duration === 'number' ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={15} color={theme.colors.accent} />
                    <Text variant="caption" color="textSecondary">{workout.duration} min</Text>
                  </View>
                ) : null}
                {workout.category ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="albums-outline" size={15} color={theme.colors.accent} />
                    <Text variant="caption" color="textSecondary">{workout.category}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.divider} />

              <View style={styles.exerciseList}>
                {workout.exercises.map((exercise, exIndex) => (
                  <View key={exercise.id} style={styles.exerciseItem}>
                    <Text variant="label" color="textMuted" style={styles.exerciseNumber}>{exIndex + 1}</Text>
                    <View style={styles.flex}>
                      <Text variant="bodyStrong">{exercise.exerciseName}</Text>
                      {Array.isArray(exercise.sets) && exercise.sets.length > 0 ? (
                        exercise.sets.map((set, setIndex) => (
                          <Text key={set.id} variant="caption" color="textSecondary" style={styles.setDetail}>
                            Set {setIndex + 1}: {set.reps} reps
                            {typeof set.weight === 'number' ? ` · ${set.weight} kg` : ''}
                          </Text>
                        ))
                      ) : (
                        <Text variant="caption" color="textMuted">No sets recorded</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {workout.notes ? (
                <View style={styles.notesSection}>
                  <Text variant="overline" color="textMuted">Notes</Text>
                  <Text variant="caption" color="textSecondary" style={styles.notesText}>{workout.notes}</Text>
                </View>
              ) : null}
            </Card>
          </FadeIn>
        );
      })}

      <AppDialog {...dialog.props} />
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
  header: {
    marginBottom: t.spacing.xs,
  },
  subtitle: {
    marginBottom: t.spacing.lg,
  },
  card: {
    marginBottom: t.spacing.lg,
  },
  cardSelected: {
    borderColor: t.colors.accent,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: t.spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.lg,
    marginTop: t.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: t.colors.border,
    marginVertical: t.spacing.md,
  },
  exerciseList: {
    gap: t.spacing.md,
  },
  exerciseItem: {
    flexDirection: 'row',
    gap: t.spacing.sm,
  },
  exerciseNumber: {
    width: 18,
  },
  setDetail: {
    marginTop: 2,
  },
  notesSection: {
    marginTop: t.spacing.md,
    paddingTop: t.spacing.md,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
  notesText: {
    marginTop: t.spacing.xs,
    fontStyle: 'italic',
  },
}));
