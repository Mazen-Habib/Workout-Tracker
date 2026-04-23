import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Category,
    Exercise,
    ExerciseLibrary,
    MuscleGroup,
    Sport,
    Workout,
} from '../types/workout';
import { generateId } from './helpers';

const WORKOUTS_KEY = '@workouts';

// Save all workouts to storage
export const saveWorkouts = async (workouts: Workout[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(workouts);
    await AsyncStorage.setItem(WORKOUTS_KEY, jsonValue);
  } catch (error) {
    console.error('Error saving workouts:', error);
    throw error;
  }
};

// Load all workouts from storage
export const loadWorkouts = async (): Promise<Workout[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(WORKOUTS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading workouts:', error);
    return [];
  }
};

// Add a new workout
export const addWorkout = async (workout: Workout): Promise<void> => {
  try {
    const workouts = await loadWorkouts();
    workouts.unshift(workout); // Add to beginning of array
    await saveWorkouts(workouts);
  } catch (error) {
    console.error('Error adding workout:', error);
    throw error;
  }
};

// Delete a workout by ID
export const deleteWorkout = async (workoutId: string): Promise<void> => {
  try {
    const workouts = await loadWorkouts();
    const filtered = workouts.filter(w => w.id !== workoutId);
    await saveWorkouts(filtered);
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
};

// Clear all workouts (useful for testing)
export const clearAllWorkouts = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(WORKOUTS_KEY);
  } catch (error) {
    console.error('Error clearing workouts:', error);
    throw error;
  }
};


// ==========================================
// EXERCISE LIBRARY STORAGE
// ==========================================

const LIBRARY_KEY = '@exercise-library';

const normalizeLibrary = (library: ExerciseLibrary): ExerciseLibrary => {
  return {
    sports: (library.sports || []).map((sport) => ({
      ...sport,
      requiresMuscleGroups: sport.requiresMuscleGroups ?? true,
      categories: (sport.categories || []).map((category) => ({
        ...category,
        parentCategoryId: category.parentCategoryId ?? null,
        muscleGroups: (category.muscleGroups || []).map((muscle) => ({
          ...muscle,
          exercises: (muscle.exercises || []).map((exercise) => ({
            ...exercise,
            photoUri: exercise.photoUri || undefined,
            note: exercise.note || undefined,
          })),
        })),
        exercises: (category.exercises || []).map((exercise) => ({
          ...exercise,
          photoUri: exercise.photoUri || undefined,
          note: exercise.note || undefined,
        })),
      })),
    })),
  };
};

// Load exercise library
export const loadLibrary = async (): Promise<ExerciseLibrary> => {
  try {
    const jsonValue = await AsyncStorage.getItem(LIBRARY_KEY);
    if (jsonValue != null) {
      return normalizeLibrary(JSON.parse(jsonValue));
    }
    // Return default structure if nothing saved
    return { sports: [] };
  } catch (error) {
    console.error('Error loading library:', error);
    return { sports: [] };
  }
};

// Save exercise library
export const saveLibrary = async (library: ExerciseLibrary): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(library);
    await AsyncStorage.setItem(LIBRARY_KEY, jsonValue);
  } catch (error) {
    console.error('Error saving library:', error);
    throw error;
  }
};

// Add a new sport
export const addSport = async (
  sportName: string,
  requiresMuscleGroups: boolean = true
): Promise<void> => {
  const library = await loadLibrary();
  const newSport: Sport = {
    id: generateId(),
    name: sportName,
    requiresMuscleGroups,
    categories: [],
  };
  library.sports.push(newSport);
  await saveLibrary(library);
};

// Rename a sport
export const updateSportName = async (
  sportId: string,
  newName: string,
  requiresMuscleGroups?: boolean
): Promise<void> => {
  const library = await loadLibrary();
  const sport = library.sports.find(s => s.id === sportId);

  if (sport) {
    sport.name = newName;
    if (typeof requiresMuscleGroups === 'boolean') {
      sport.requiresMuscleGroups = requiresMuscleGroups;
    }
    sport.categories = sport.categories.map((category) => ({
      ...category,
      sport: newName,
      exercises: category.exercises.map((exercise) => ({
        ...exercise,
        sport: newName,
      })),
      muscleGroups: category.muscleGroups.map((muscle) => ({
        ...muscle,
        sport: newName,
        exercises: muscle.exercises.map((exercise) => ({
          ...exercise,
          sport: newName,
        })),
      })),
    }));
    await saveLibrary(library);
  }
};

// Delete a sport and all nested categories/muscles/exercises
export const deleteSport = async (sportId: string): Promise<void> => {
  const library = await loadLibrary();
  library.sports = library.sports.filter(s => s.id !== sportId);
  await saveLibrary(library);
};

// Add a new category to a sport
export const addCategory = async (
  sportId: string,
  categoryName: string,
  parentCategoryId: string | null = null
): Promise<void> => {
  const library = await loadLibrary();
  const sport = library.sports.find(s => s.id === sportId);
  if (sport) {
    const newCategory: Category = {
      id: generateId(),
      name: categoryName,
      sport: sport.name,
      parentCategoryId,
      muscleGroups: [],
      exercises: [],
    };
    sport.categories.push(newCategory);
    await saveLibrary(library);
  }
};

// Rename a category
export const updateCategoryName = async (
  sportId: string,
  categoryId: string,
  newName: string
): Promise<void> => {
  const library = await loadLibrary();
  const sport = library.sports.find(s => s.id === sportId);
  const category = sport?.categories.find(c => c.id === categoryId);

  if (category) {
    category.name = newName;
    category.exercises = category.exercises.map((exercise) => ({
      ...exercise,
      category: newName,
    }));
    category.muscleGroups = category.muscleGroups.map((muscle) => ({
      ...muscle,
      category: newName,
      exercises: muscle.exercises.map((exercise) => ({
        ...exercise,
        category: newName,
      })),
    }));
    await saveLibrary(library);
  }
};

// Delete a category and all nested muscle groups + exercises
export const deleteCategory = async (sportId: string, categoryId: string): Promise<void> => {
  const library = await loadLibrary();
  const sport = library.sports.find(s => s.id === sportId);

  if (sport) {
    const toDelete = new Set<string>([categoryId]);
    let foundChild = true;

    while (foundChild) {
      foundChild = false;
      for (const category of sport.categories) {
        if (category.parentCategoryId && toDelete.has(category.parentCategoryId) && !toDelete.has(category.id)) {
          toDelete.add(category.id);
          foundChild = true;
        }
      }
    }

    sport.categories = sport.categories.filter(c => !toDelete.has(c.id));
    await saveLibrary(library);
  }
};

// Add a new muscle group to a category
export const addMuscleGroup = async (
  sportId: string,
  categoryId: string,
  muscleName: string
): Promise<void> => {
  const library = await loadLibrary();
  const sport = library.sports.find(s => s.id === sportId);
  const category = sport?.categories.find(c => c.id === categoryId);
  if (category) {
    const newMuscle: MuscleGroup = {
      id: generateId(),
      name: muscleName,
      category: category.name,
      sport: sport!.name,
      exercises: [],
    };
    category.muscleGroups.push(newMuscle);
    await saveLibrary(library);
  }
};

// Rename a muscle group
export const updateMuscleGroupName = async (
  sportId: string,
  categoryId: string,
  muscleId: string,
  newName: string
): Promise<void> => {
  const library = await loadLibrary();
  const sport = library.sports.find(s => s.id === sportId);
  const category = sport?.categories.find(c => c.id === categoryId);
  const muscle = category?.muscleGroups.find(m => m.id === muscleId);

  if (muscle) {
    muscle.name = newName;
    muscle.exercises = muscle.exercises.map((exercise) => ({
      ...exercise,
      muscle: newName,
    }));
    await saveLibrary(library);
  }
};

// Delete a muscle group and all nested exercises
export const deleteMuscleGroup = async (
  sportId: string,
  categoryId: string,
  muscleId: string
): Promise<void> => {
  const library = await loadLibrary();
  const sport = library.sports.find(s => s.id === sportId);
  const category = sport?.categories.find(c => c.id === categoryId);

  if (category) {
    category.muscleGroups = category.muscleGroups.filter(m => m.id !== muscleId);
    await saveLibrary(library);
  }
};

// Add a new exercise to a muscle group
export const addExercise = async (
  sportId: string,
  categoryId: string,
  muscleId: string | null,
  exerciseName: string
): Promise<void> => {
  const library = await loadLibrary();
  const sport = library.sports.find(s => s.id === sportId);
  const category = sport?.categories.find(c => c.id === categoryId);
  const muscle = muscleId ? category?.muscleGroups.find(m => m.id === muscleId) : undefined;
  
  if (muscle && category && sport) {
    const newExercise: Exercise = {
      id: generateId(),
      name: exerciseName,
      muscle: muscle.name,
      category: category.name,
      sport: sport.name,
    };
    muscle.exercises.push(newExercise);
    await saveLibrary(library);
    return;
  }

  if (category && sport) {
    const newExercise: Exercise = {
      id: generateId(),
      name: exerciseName,
      muscle: category.name,
      category: category.name,
      sport: sport.name,
    };
    category.exercises.push(newExercise);
    await saveLibrary(library);
  }
};

const findExerciseInLibrary = (
  library: ExerciseLibrary,
  sportId: string,
  categoryId: string,
  muscleId: string | null,
  exerciseId: string
): Exercise | undefined => {
  const sport = library.sports.find((item) => item.id === sportId);
  const category = sport?.categories.find((item) => item.id === categoryId);
  const muscle = muscleId ? category?.muscleGroups.find((item) => item.id === muscleId) : undefined;

  if (muscle) {
    return muscle.exercises.find((item) => item.id === exerciseId);
  }

  return category?.exercises.find((item) => item.id === exerciseId);
};

export const updateExercisePhoto = async (
  sportId: string,
  categoryId: string,
  muscleId: string | null,
  exerciseId: string,
  photoUri: string | null
): Promise<void> => {
  const library = await loadLibrary();
  const exercise = findExerciseInLibrary(library, sportId, categoryId, muscleId, exerciseId);

  if (exercise) {
    exercise.photoUri = photoUri || undefined;
    await saveLibrary(library);
  }
};

export const updateExerciseNote = async (
  sportId: string,
  categoryId: string,
  muscleId: string | null,
  exerciseId: string,
  note: string | null
): Promise<void> => {
  const library = await loadLibrary();
  const exercise = findExerciseInLibrary(library, sportId, categoryId, muscleId, exerciseId);

  if (exercise) {
    const trimmedNote = (note || '').trim();
    exercise.note = trimmedNote.length > 0 ? trimmedNote : undefined;
    await saveLibrary(library);
  }
};

// Rename exercise
export const updateExerciseName = async (
  sportId: string,
  categoryId: string,
  muscleId: string | null,
  exerciseId: string,
  newName: string
): Promise<void> => {
  const library = await loadLibrary();
  const sport = library.sports.find(s => s.id === sportId);
  const category = sport?.categories.find(c => c.id === categoryId);
  const muscle = muscleId ? category?.muscleGroups.find(m => m.id === muscleId) : undefined;
  const exercise = muscle?.exercises.find(e => e.id === exerciseId);

  if (exercise) {
    exercise.name = newName;
    await saveLibrary(library);
    return;
  }

  const categoryExercise = category?.exercises.find(e => e.id === exerciseId);
  if (categoryExercise) {
    categoryExercise.name = newName;
    await saveLibrary(library);
  }
};

// Delete exercise (long press)
export const deleteExercise = async (
  sportId: string,
  categoryId: string,
  muscleId: string | null,
  exerciseId: string
): Promise<void> => {
  const library = await loadLibrary();
  const sport = library.sports.find(s => s.id === sportId);
  const category = sport?.categories.find(c => c.id === categoryId);
  const muscle = muscleId ? category?.muscleGroups.find(m => m.id === muscleId) : undefined;
  
  if (muscle) {
    muscle.exercises = muscle.exercises.filter(e => e.id !== exerciseId);
    await saveLibrary(library);
    return;
  }

  if (category) {
    category.exercises = category.exercises.filter(e => e.id !== exerciseId);
    await saveLibrary(library);
  }
};

// Delete a specific exercise history entry from a workout
// If this removes the last exercise in that workout, the workout itself is deleted.
export const deleteExerciseFromWorkout = async (
  workoutId: string,
  exerciseId: string
): Promise<void> => {
  const workouts = await loadWorkouts();
  const updated = workouts
    .map((workout) => {
      if (workout.id !== workoutId) {
        return workout;
      }

      return {
        ...workout,
        exercises: workout.exercises.filter((exercise) => exercise.exerciseId !== exerciseId),
      };
    })
    .filter((workout) => workout.exercises.length > 0);

  await saveWorkouts(updated);
};

// Initialize library with Gym > Push > Chest exercises (for demo)
export const initializeDefaultLibrary = async (): Promise<void> => {
  const library = await loadLibrary();
  
  // Only initialize if empty
  if (library.sports.length > 0) return;
  
  const gymSport: Sport = {
    id: generateId(),
    name: 'Gym',
    requiresMuscleGroups: true,
    categories: [
      {
        id: generateId(),
        name: 'Push',
        sport: 'Gym',
        parentCategoryId: null,
        exercises: [],
        muscleGroups: [
          {
            id: generateId(),
            name: 'Chest',
            category: 'Push',
            sport: 'Gym',
            exercises: [
              { id: generateId(), name: 'Bench Press', muscle: 'Chest', category: 'Push', sport: 'Gym' },
              { id: generateId(), name: 'Incline Bench Press', muscle: 'Chest', category: 'Push', sport: 'Gym' },
              { id: generateId(), name: 'Dumbbell Press', muscle: 'Chest', category: 'Push', sport: 'Gym' },
              { id: generateId(), name: 'Cable Fly', muscle: 'Chest', category: 'Push', sport: 'Gym' },
              { id: generateId(), name: 'Butterfly', muscle: 'Chest', category: 'Push', sport: 'Gym' },
            ],
          },
        ],
      },
    ],
  };
  
  library.sports.push(gymSport);
  await saveLibrary(library);
};

// ==========================================
// QUICK NOTES STORAGE
// ==========================================

const NOTES_KEY = '@quick-notes';
const HOME_BACKGROUND_KEY = '@home-background-image';

interface QuickNote {
  id: string;
  text: string;
  createdAt: string;
}

// Load all notes from storage
export const loadNotes = async (): Promise<QuickNote[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(NOTES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading notes:', error);
    return [];
  }
};

// Save all notes to storage
export const saveNotes = async (notes: QuickNote[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(notes);
    await AsyncStorage.setItem(NOTES_KEY, jsonValue);
  } catch (error) {
    console.error('Error saving notes:', error);
    throw error;
  }
};

// ==========================================
// HOME BACKGROUND IMAGE STORAGE
// ==========================================

export const loadHomeBackgroundImage = async (): Promise<string | null> => {
  try {
    const uri = await AsyncStorage.getItem(HOME_BACKGROUND_KEY);
    return uri || null;
  } catch (error) {
    console.error('Error loading home background image:', error);
    return null;
  }
};

export const saveHomeBackgroundImage = async (uri: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(HOME_BACKGROUND_KEY, uri);
  } catch (error) {
    console.error('Error saving home background image:', error);
    throw error;
  }
};

export const removeHomeBackgroundImage = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(HOME_BACKGROUND_KEY);
  } catch (error) {
    console.error('Error removing home background image:', error);
    throw error;
  }
};
