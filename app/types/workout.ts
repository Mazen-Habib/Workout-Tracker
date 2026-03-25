// ==========================================
// SPORTS & EXERCISE LIBRARY STRUCTURE
// ==========================================

// Individual set within an exercise
export interface ExerciseSet {
  id: string;
  reps: number;
  weight: number;
}

// Exercise with all its sets
export interface WorkoutExercise {
  id: string;
  exerciseId: string;      // Reference to exercise in library
  exerciseName: string;    // Denormalized for easy display
  muscle: string;          // Which muscle group
  sets: ExerciseSet[];     // Individual sets
}

// Complete workout session
export interface Workout {
  id: string;
  date: string;            // ISO date string
  sport: string;           // "Gym" or "Calisthenics"
  category: string;        // "Push", "Pull", "Legs"
  exercises: WorkoutExercise[];
  duration?: number;       // Optional for now
  notes?: string;
}

// ==========================================
// EXERCISE LIBRARY STRUCTURE
// ==========================================

// Single exercise in the library
export interface Exercise {
  id: string;
  name: string;            // "Bench Press"
  muscle: string;          // "Chest"
  category: string;        // "Push"
  sport: string;           // "Gym"
}

// Muscle group with its exercises
export interface MuscleGroup {
  id: string;
  name: string;            // "Chest"
  category: string;        // "Push"
  sport: string;           // "Gym"
  exercises: Exercise[];
}

// Category with its muscle groups
export interface Category {
  id: string;
  name: string;            // "Push"
  sport: string;           // "Gym"
  muscleGroups: MuscleGroup[];
}

// Sport with its categories
export interface Sport {
  id: string;
  name: string;            // "Gym"
  categories: Category[];
}

// Complete library structure
export interface ExerciseLibrary {
  sports: Sport[];
}