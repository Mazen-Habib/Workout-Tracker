import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Workout, WorkoutExercise } from '../types/workout';
import { loadWorkouts } from '../utils/storage';

interface ExerciseHistoryCardProps {
  exerciseId: string;
  exerciseName: string;
}

export default function ExerciseHistoryCard({
  exerciseId,
  exerciseName,
}: ExerciseHistoryCardProps) {
  const [lastWorkout, setLastWorkout] = useState<Workout | null>(null);
  const [lastExercise, setLastExercise] = useState<WorkoutExercise | null>(null);

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

        const mostRecentWorkout = sortedByDate[0];

        if (!mostRecentWorkout) {
          setLastWorkout(null);
          setLastExercise(null);
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
      }
    };

    loadExerciseHistory();
  }, [exerciseId]);

  const renderSetLines = () => {
    if (!lastExercise) {
      return null;
    }

    const rawSets = (lastExercise as WorkoutExercise & { sets?: unknown }).sets;

    if (!Array.isArray(rawSets)) {
      return (
        <Text style={styles.emptyText}>No previous workout for this exercise</Text>
      );
    }

    if (rawSets.length === 0) {
      return (
        <Text style={styles.emptyText}>No previous workout for this exercise</Text>
      );
    }

    return rawSets.map((set, index) => {
      const maybeSet = set as { id?: string; reps?: number; weight?: number };
      const setKey = maybeSet.id ?? `${exerciseId}-${index}`;
      const reps = typeof maybeSet.reps === 'number' ? maybeSet.reps : 0;
      const weight = typeof maybeSet.weight === 'number' ? maybeSet.weight : 0;

      return (
        <Text key={setKey} style={styles.setText}>
          Set {index + 1}: {reps} reps × {weight} kg
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
      <Text style={styles.headerText}>Last Workout</Text>
      <Text style={styles.dateText}>{format(new Date(lastWorkout.date), 'MMM d, yyyy')}</Text>
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
  dateText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
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
