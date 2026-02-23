import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout } from '../types/workout';

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
