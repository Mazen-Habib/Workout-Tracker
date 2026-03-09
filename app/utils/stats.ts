import { Workout } from '../types/workout';

// Get total number of exercises across all workouts
export const getTotalExercises = (workouts: Workout[]): number => {
  return workouts.reduce((total, workout) => total + workout.exercises.length, 0);
};

// Get total weight lifted across all workouts
export const getTotalVolume = (workouts: Workout[]): number => {
  let total = 0;
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        total += set.reps * set.weight;
      });
    });
  });
  return total;
};

// Get all unique exercise names
export const getUniqueExercises = (workouts: Workout[]): string[] => {
  const exerciseSet = new Set<string>();
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exerciseSet.add(exercise.exerciseName);
    });
  });
  return Array.from(exerciseSet).sort();
};

// Get personal record (max weight) for each exercise
export const getPersonalRecords = (workouts: Workout[]): { name: string; weight: number }[] => {
  const records = new Map<string, number>();
  
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        const currentMax = records.get(exercise.exerciseName) || 0;
        if (set.weight > currentMax) {
          records.set(exercise.exerciseName, set.weight);
        }
      });
    });
  });

  return Array.from(records.entries())
    .map(([name, weight]) => ({ name, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5); // Top 5 PRs
};

// Get workout count by week (last 4 weeks)
export const getWorkoutsByWeek = (workouts: Workout[]): number[] => {
  const now = new Date();
  const weekCounts = [0, 0, 0, 0]; // Last 4 weeks
  
  workouts.forEach(workout => {
    const workoutDate = new Date(workout.date);
    const diffTime = now.getTime() - workoutDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) weekCounts[3]++;
    else if (diffDays < 14) weekCounts[2]++;
    else if (diffDays < 21) weekCounts[1]++;
    else if (diffDays < 28) weekCounts[0]++;
  });
  
  return weekCounts;
};