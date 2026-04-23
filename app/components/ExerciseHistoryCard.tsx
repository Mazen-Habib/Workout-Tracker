import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ExerciseSet, Workout, WorkoutExercise } from '../types/workout';
import { loadWorkouts } from '../utils/storage';

interface ExerciseHistoryCardProps {
  exerciseId: string;
}

interface ExercisePr {
  set: ExerciseSet;
  workoutDate: string;
}

export default function ExerciseHistoryCard({
  exerciseId,
}: ExerciseHistoryCardProps) {
  const [lastWorkout, setLastWorkout] = useState<Workout | null>(null);
  const [lastExercise, setLastExercise] = useState<WorkoutExercise | null>(null);
  const [exercisePr, setExercisePr] = useState<ExercisePr | null>(null);

  const getValidSets = (exercise: WorkoutExercise): ExerciseSet[] => {
    const rawSets = (exercise as WorkoutExercise & { sets?: unknown }).sets;

    if (!Array.isArray(rawSets)) {
      return [];
    }

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

        const workoutsWithExercise = workouts.filter((workout) =>
          workout.exercises.some((exercise) => exercise.exerciseId === exerciseId)
        );

        const sortedByDate = [...workoutsWithExercise].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        let bestPr: ExercisePr | null = null;
        sortedByDate.forEach((workout) => {
          workout.exercises
            .filter((exercise) => exercise.exerciseId === exerciseId)
            .forEach((exercise) => {
              getValidSets(exercise).forEach((set) => {
                if (typeof set.weight !== 'number') {
                  return;
                }

                if (!bestPr) {
                  bestPr = { set, workoutDate: workout.date };
                  return;
                }

                if (typeof bestPr.set.weight !== 'number') {
                  bestPr = { set, workoutDate: workout.date };
                  return;
                }

                const isBetterWeight = set.weight > bestPr.set.weight;
                const isSameWeightBetterReps =
                  set.weight === bestPr.set.weight && set.reps > bestPr.set.reps;

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

        const matchingExercise = mostRecentWorkout.exercises.find(
          (exercise) => exercise.exerciseId === exerciseId
        );

        setLastWorkout(mostRecentWorkout);
        setLastExercise(matchingExercise ?? null);
      } catch (error) {
        console.error('Error loading exercise history:', error);
        setLastWorkout(null);
        setLastExercise(null);
        setExercisePr(null);
      }
    };

    loadExerciseHistory();
  }, [exerciseId]);

  const renderSetLines = () => {
    if (!lastExercise) {
      return null;
    }

    const validSets = getValidSets(lastExercise);

    if (validSets.length === 0) {
      return (
        <Text style={styles.emptyText}>No previous workout for this exercise</Text>
      );
    }

    return validSets.map((set, index) => {
      const setKey = set.id ?? `${exerciseId}-${index}`;

      return (
        <View key={setKey} style={styles.setRow}>
          <Text style={styles.setNumber}>Set {index + 1}</Text>
          <Text style={styles.setValue}>
            {typeof set.weight === 'number'
              ? `${set.reps} reps x ${set.weight} kg`
              : `${set.reps} reps`}
          </Text>
        </View>
      );
    });
  };

  if (!lastWorkout || !lastExercise) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No previous workout for this exercise</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="time-outline" size={16} color="#93c5fd" />
          <Text style={styles.topLabel}>Last Workout Snapshot</Text>
        </View>
        <View style={styles.datePill}>
          <Text style={styles.datePillText}>{format(new Date(lastWorkout.date), 'MMM d, yyyy')}</Text>
        </View>
      </View>

      <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>All-Time Max</Text>
        {exercisePr ? (
          <>
            <Text style={styles.prValueMain}>
              {exercisePr.set.weight} kg x {exercisePr.set.reps}
            </Text>
            <Text style={styles.prDate}>
              {format(new Date(exercisePr.workoutDate), 'MMM d, yyyy')}
            </Text>
          </>
        ) : (
          <Text style={styles.prDate}>No PR yet</Text>
        )}
      </View>
      <View style={styles.separator} />
      <Text style={styles.setsHeader}>Sets from last session</Text>
      {renderSetLines()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topLabel: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  datePill: {
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    borderColor: '#bfdbfe',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  datePillText: {
    fontSize: 12,
    color: '#1e3a8a',
    fontWeight: '600',
  },
  metricCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  prValueMain: {
    fontSize: 14,
    color: '#60a5fa',
    fontWeight: '700',
    marginTop: 5,
  },
  prDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  setsHeader: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  setNumber: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  setValue: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
});
