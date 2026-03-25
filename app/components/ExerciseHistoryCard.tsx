import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ExerciseSet, Workout, WorkoutExercise } from '../types/workout';
import { loadWorkouts } from '../utils/storage';

interface ExerciseHistoryCardProps {
  exerciseId: string;
  exerciseName: string;
}

interface ExercisePr {
  set: ExerciseSet;
  workoutDate: string;
}

export default function ExerciseHistoryCard({
  exerciseId,
  exerciseName,
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
      .map((set) => set as { id?: string; reps?: number; weight?: number })
      .filter(
        (set) =>
          typeof set.id === 'string' &&
          typeof set.reps === 'number' &&
          typeof set.weight === 'number'
      )
      .map((set) => ({
        id: set.id as string,
        reps: set.reps as number,
        weight: set.weight as number,
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
                if (!bestPr) {
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
        <Text key={setKey} style={styles.setText}>
          Set {index + 1}: {set.reps} reps × {set.weight} kg
        </Text>
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
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerText}>Last Workout</Text>
          <Text style={styles.dateText}>{format(new Date(lastWorkout.date), 'MMM d, yyyy')}</Text>
        </View>
        <View style={styles.prContainer}>
          <Text style={styles.prLabel}>All-Time Max</Text>
          {exercisePr ? (
            <>
              <Text style={styles.prValue}>
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
      </View>
      <View style={styles.separator} />
      {renderSetLines()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#262626',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  prContainer: {
    alignItems: 'flex-end',
    maxWidth: '58%',
  },
  prLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  prValue: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '700',
    marginTop: 4,
  },
  prDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 12,
  },
  setText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});
