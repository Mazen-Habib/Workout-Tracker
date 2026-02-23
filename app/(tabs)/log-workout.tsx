import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Exercise, Workout } from '../types/workout';
import { generateId } from '../utils/helpers';
import { addWorkout } from '../utils/storage';

export default function LogWorkoutScreen() {
  const router = useRouter();
  
  // Form state for new exercise
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  
  // List of exercises added to this workout
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  // Workout duration
  const [duration, setDuration] = useState('');

  // Add exercise to the list
  const handleAddExercise = () => {
    // Validation
    if (!exerciseName.trim()) {
      Alert.alert('Error', 'Please enter exercise name');
      return;
    }
    if (!sets || !reps || !weight) {
      Alert.alert('Error', 'Please fill in sets, reps, and weight');
      return;
    }

    const newExercise: Exercise = {
      id: generateId(),
      name: exerciseName.trim(),
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight: parseFloat(weight),
    };

    setExercises([...exercises, newExercise]);
    
    // Clear form
    setExerciseName('');
    setSets('');
    setReps('');
    setWeight('');
  };

  // Remove exercise from list
  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  // Save the entire workout
  const handleSaveWorkout = async () => {
    // Validation
    if (exercises.length === 0) {
      Alert.alert('Error', 'Add at least one exercise');
      return;
    }
    if (!duration) {
      Alert.alert('Error', 'Please enter workout duration');
      return;
    }

    const workout: Workout = {
      id: generateId(),
      date: new Date().toISOString(),
      exercises: exercises,
      duration: parseInt(duration),
    };

    try {
      await addWorkout(workout);
      Alert.alert('Success', 'Workout saved!', [
        {
          text: 'OK',
          onPress: () => {
            // Clear form
            setExercises([]);
            setDuration('');
            // Go to home screen
            router.push('/');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Exercise Input Form */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Add Exercise</Text>
        
        <Text style={styles.label}>Exercise Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Bench Press"
          placeholderTextColor="#6b7280"
          value={exerciseName}
          onChangeText={setExerciseName}
        />

        <View style={styles.row}>
          <View style={styles.smallInputContainer}>
            <Text style={styles.label}>Sets</Text>
            <TextInput
              style={styles.input}
              placeholder="3"
              placeholderTextColor="#6b7280"
              keyboardType="number-pad"
              value={sets}
              onChangeText={setSets}
            />
          </View>

          <View style={styles.smallInputContainer}>
            <Text style={styles.label}>Reps</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              placeholderTextColor="#6b7280"
              keyboardType="number-pad"
              value={reps}
              onChangeText={setReps}
            />
          </View>

          <View style={styles.smallInputContainer}>
            <Text style={styles.label}>Weight (lbs)</Text>
            <TextInput
              style={styles.input}
              placeholder="135"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddExercise}>
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </TouchableOpacity>
      </View>

      {/* Exercise List */}
      {exercises.length > 0 && (
        <View style={styles.exerciseListSection}>
          <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>
          
          {exercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetails}>
                  {exercise.sets} sets × {exercise.reps} reps @ {exercise.weight} lbs
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveExercise(exercise.id)}>
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Duration & Save */}
      {exercises.length > 0 && (
        <View style={styles.finalSection}>
          <Text style={styles.label}>Workout Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            placeholder="45"
            placeholderTextColor="#6b7280"
            keyboardType="number-pad"
            value={duration}
            onChangeText={setDuration}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveWorkout}>
            <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
            <Text style={styles.saveButtonText}>Save Workout</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  formSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  smallInputContainer: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseListSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: '#262626',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#9ca3af',
  },
  finalSection: {
    padding: 20,
    paddingTop: 0,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});