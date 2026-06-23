import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Card, Text } from '@/components/ui';
import { makeStyles, useTheme } from '@/theme';
import { ExerciseSet, Workout, WorkoutExercise } from '../types/workout';
import { loadWorkouts } from '../utils/storage';

interface ExerciseHistoryCardProps {
  exerciseId: string;
}

interface ExercisePr {
  set: ExerciseSet;
  workoutDate: string;
}

export default function ExerciseHistoryCard({ exerciseId }: ExerciseHistoryCardProps) {
  const theme = useTheme();
  const styles = useStyles();
  const [lastWorkout, setLastWorkout] = useState<Workout | null>(null);
  const [lastExercise, setLastExercise] = useState<WorkoutExercise | null>(null);
  const [exercisePr, setExercisePr] = useState<ExercisePr | null>(null);

  const getValidSets = (exercise: WorkoutExercise): ExerciseSet[] => {
    const rawSets = (exercise as WorkoutExercise & { sets?: unknown }).sets;
    if (!Array.isArray(rawSets)) return [];
    return rawSets
      .map((set) => set as { id?: string; reps?: number; weight?: number | null })
      .filter(
        (set) =>
          typeof set.id === 'string' &&
          typeof set.reps === 'number' &&
          (typeof set.weight === 'number' || set.weight === null || typeof set.weight === 'undefined')
      )
      .map((set) => ({
        id: set.id as string,
        reps: set.reps as number,
        weight: typeof set.weight === 'number' ? set.weight : null,
      }));
  };

  useEffect(() => {
    const loadExerciseHistory = async () => {
      try {
        const workouts = await loadWorkouts();
        const sortedByDate = workouts
          .filter((workout) => workout.exercises.some((e) => e.exerciseId === exerciseId))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        let bestPr: ExercisePr | null = null;
        sortedByDate.forEach((workout) => {
          workout.exercises
            .filter((exercise) => exercise.exerciseId === exerciseId)
            .forEach((exercise) => {
              getValidSets(exercise).forEach((set) => {
                if (typeof set.weight !== 'number') return;
                if (!bestPr || typeof bestPr.set.weight !== 'number') {
                  bestPr = { set, workoutDate: workout.date };
                  return;
                }
                const isBetterWeight = set.weight > bestPr.set.weight;
                const isSameWeightBetterReps = set.weight === bestPr.set.weight && set.reps > bestPr.set.reps;
                if (isBetterWeight || isSameWeightBetterReps) {
                  bestPr = { set, workoutDate: workout.date };
                }
              });
            });
        });
        setExercisePr(bestPr);

        const mostRecentWorkout = sortedByDate[0];
        if (!mostRecentWorkout) {
          setLastWorkout(null);
          setLastExercise(null);
          setExercisePr(null);
          return;
        }
        setLastWorkout(mostRecentWorkout);
        setLastExercise(mostRecentWorkout.exercises.find((e) => e.exerciseId === exerciseId) ?? null);
      } catch (error) {
        console.error('Error loading exercise history:', error);
        setLastWorkout(null);
        setLastExercise(null);
        setExercisePr(null);
      }
    };
    loadExerciseHistory();
  }, [exerciseId]);

  if (!lastWorkout || !lastExercise) {
    return (
      <Card style={styles.card}>
        <Text variant="caption" color="textMuted">No previous workout for this exercise</Text>
      </Card>
    );
  }

  const validSets = getValidSets(lastExercise);

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="time-outline" size={15} color={theme.colors.accent} />
          <Text variant="overline" color="accent">Last Workout</Text>
        </View>
        <View style={styles.datePill}>
          <Text variant="caption" color="accent">{format(new Date(lastWorkout.date), 'MMM d, yyyy')}</Text>
        </View>
      </View>

      <View style={styles.metricCard}>
        <Text variant="overline" color="textMuted">All-Time Max</Text>
        {exercisePr ? (
          <>
            <Text variant="subheading" color="accent" style={styles.prValue}>
              {exercisePr.set.weight} kg × {exercisePr.set.reps}
            </Text>
            <Text variant="caption" color="textMuted">{format(new Date(exercisePr.workoutDate), 'MMM d, yyyy')}</Text>
          </>
        ) : (
          <Text variant="caption" color="textMuted" style={styles.prValue}>No PR yet</Text>
        )}
      </View>

      <Text variant="overline" color="textSecondary" style={styles.setsHeader}>Sets from last session</Text>
      {validSets.length === 0 ? (
        <Text variant="caption" color="textMuted">No previous workout for this exercise</Text>
      ) : (
        validSets.map((set, index) => (
          <View key={set.id ?? `${exerciseId}-${index}`} style={styles.setRow}>
            <Text variant="caption" color="textSecondary">Set {index + 1}</Text>
            <Text variant="caption" weight="700">
              {typeof set.weight === 'number' ? `${set.reps} reps × ${set.weight} kg` : `${set.reps} reps`}
            </Text>
          </View>
        ))
      )}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    marginBottom: t.spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: t.spacing.md,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  datePill: {
    backgroundColor: t.colors.accentSoft,
    borderRadius: t.radius.full,
    borderColor: t.colors.accentBorder,
    borderWidth: 1,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.xs,
  },
  metricCard: {
    backgroundColor: t.colors.surfaceMuted,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: t.spacing.md,
  },
  prValue: {
    marginTop: t.spacing.xs,
  },
  setsHeader: {
    marginTop: t.spacing.lg,
    marginBottom: t.spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: t.colors.surfaceMuted,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    borderColor: t.colors.border,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    marginBottom: t.spacing.xs,
  },
}));
