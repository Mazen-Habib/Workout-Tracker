// Represents a single exercise in a workout
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number; // in pounds or kg
}

// Represents a complete workout session
export interface Workout {
  id: string;
  date: string; // ISO date string
  exercises: Exercise[];
  duration: number; // in minutes
  notes?: string; // optional notes
}

// Helper type for creating new workouts (without id and date)
export interface NewWorkout {
  exercises: Exercise[];
  duration: number;
  notes?: string;
}