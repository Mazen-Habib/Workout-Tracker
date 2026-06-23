import { startOfDay, subDays, format } from 'date-fns';
import { Workout } from '../types/workout';

// Total volume (reps × weight) for a single workout
const workoutVolume = (workout: Workout): number => {
  let total = 0;
  workout.exercises.forEach((exercise) => {
    if (Array.isArray(exercise.sets)) {
      exercise.sets.forEach((set) => {
        total += set.reps * (set.weight ?? 0);
      });
    }
  });
  return total;
};

// Get total number of exercises across all workouts
export const getTotalExercises = (workouts: Workout[]): number => {
  return workouts.reduce((total, workout) => total + workout.exercises.length, 0);
};

// Get total weight lifted across all workouts
export const getTotalVolume = (workouts: Workout[]): number => {
  let total = 0;
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      if (exercise.sets && Array.isArray(exercise.sets)) {
        exercise.sets.forEach(set => {
          total += set.reps * (set.weight ?? 0);
        });
      }
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
      if (exercise.sets && Array.isArray(exercise.sets)) {
        exercise.sets.forEach(set => {
          if (typeof set.weight !== 'number') {
            return;
          }
          const currentMax = records.get(exercise.exerciseName) || 0;
          if (set.weight > currentMax) {
            records.set(exercise.exerciseName, set.weight);
          }
        });
      }
    });
  });

  return Array.from(records.entries())
    .map(([name, weight]) => ({ name, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5); // Top 5 PRs
};

// ==========================================
// DASHBOARD HELPERS
// ==========================================

export interface DailyActivity {
  label: string; // single-letter weekday
  date: string;
  workouts: number;
  volume: number;
}

// Activity for each of the last `days` days (oldest → newest)
export const getDailyActivity = (workouts: Workout[], days: number = 7): DailyActivity[] => {
  const today = startOfDay(new Date());
  const buckets: DailyActivity[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(today, i);
    buckets.push({ label: format(day, 'EEEEE'), date: day.toISOString(), workouts: 0, volume: 0 });
  }

  workouts.forEach((workout) => {
    const workoutDay = startOfDay(new Date(workout.date)).getTime();
    const bucket = buckets.find((b) => startOfDay(new Date(b.date)).getTime() === workoutDay);
    if (bucket) {
      bucket.workouts += 1;
      bucket.volume += workoutVolume(workout);
    }
  });

  return buckets;
};

// Current consecutive-day workout streak (counts today or yesterday as the anchor)
export const getStreak = (workouts: Workout[]): number => {
  if (workouts.length === 0) return 0;

  const days = new Set(workouts.map((w) => startOfDay(new Date(w.date)).getTime()));
  let cursor = startOfDay(new Date());

  if (!days.has(cursor.getTime())) {
    cursor = subDays(cursor, 1);
    if (!days.has(cursor.getTime())) return 0;
  }

  let streak = 0;
  while (days.has(cursor.getTime())) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
};

export interface ExerciseFrequency {
  name: string;
  count: number;
}

// Most-logged exercises; remainder grouped into "Other"
export const getTopExercises = (workouts: Workout[], limit: number = 4): ExerciseFrequency[] => {
  const counts = new Map<string, number>();
  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      counts.set(exercise.exerciseName, (counts.get(exercise.exerciseName) || 0) + 1);
    });
  });

  const sorted = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  if (sorted.length <= limit) return sorted;

  const top = sorted.slice(0, limit);
  const otherCount = sorted.slice(limit).reduce((sum, item) => sum + item.count, 0);
  return [...top, { name: 'Other', count: otherCount }];
};

export interface ExerciseBest {
  maxWeight: number;
  maxReps: number;
  hasHistory: boolean;
  hasWeight: boolean;
}

// Best prior weight/reps for an exercise — used to detect a new PR.
export const getExerciseBest = (workouts: Workout[], exerciseId: string): ExerciseBest => {
  let maxWeight = 0;
  let maxReps = 0;
  let hasHistory = false;
  let hasWeight = false;

  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      if (exercise.exerciseId !== exerciseId || !Array.isArray(exercise.sets)) return;
      exercise.sets.forEach((set) => {
        hasHistory = true;
        if (typeof set.weight === 'number') {
          hasWeight = true;
          if (set.weight > maxWeight) maxWeight = set.weight;
        }
        if (set.reps > maxReps) maxReps = set.reps;
      });
    });
  });

  return { maxWeight, maxReps, hasHistory, hasWeight };
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