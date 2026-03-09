import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Exercise, ExerciseLibrary } from './types/workout';
import { loadLibrary } from './utils/storage';

const WIDTH = Dimensions.get('window').width;

export default function LogExerciseScreen() {
  const router = useRouter();
  const { sportId, categoryId, muscleId, exerciseId } = useLocalSearchParams<{
    sportId: string;
    categoryId: string;
    muscleId: string;
    exerciseId: string;
  }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState<Array<{ reps: string; weight: string }>>([
    { reps: '', weight: '' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExerciseData();
  }, []);

  const loadExerciseData = async () => {
    try {
      setLoading(true);
      const library: ExerciseLibrary = await loadLibrary();
      const sport = library.sports.find((s) => s.id === sportId);
      const category = sport?.categories.find((c) => c.id === categoryId);
      const muscle = category?.muscleGroups.find((m) => m.id === muscleId);
      const foundExercise = muscle?.exercises.find((e) => e.id === exerciseId);
      
      if (foundExercise) {
        setExercise(foundExercise);
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSet = () => {
    setSets([...sets, { reps: '', weight: '' }]);
  };

  const handleUpdateSet = (index: number, field: 'reps' | 'weight', value: string) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const handleCompleteSet = () => {
    // TODO: Save the workout data to storage
    router.back();
  };

  const handleRemoveSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.title}>{exercise?.name}</Text>
          <Text style={styles.subtitle}>{exercise?.muscle}</Text>
          
          <ScrollView
            contentContainerStyle={styles.setsList}
            scrollEnabled={sets.length > 3}
          >
            {sets.map((set, index) => (
              <View key={index} style={styles.setCard}>
                <Text style={styles.setLabel}>Set {index + 1}</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Reps</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#6b7280"
                      keyboardType="number-pad"
                      value={set.reps}
                      onChangeText={(value) =>
                        handleUpdateSet(index, 'reps', value)
                      }
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Weight (kg)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#6b7280"
                      keyboardType="decimal-pad"
                      value={set.weight}
                      onChangeText={(value) =>
                        handleUpdateSet(index, 'weight', value)
                      }
                    />
                  </View>
                </View>
                {sets.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveSet(index)}
                  >
                    <Ionicons name="close" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.addSetButton}
              onPress={handleAddSet}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
              <Text style={styles.addSetButtonText}>Add Set</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteSet}
            >
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  setsList: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  setCard: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  setLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderColor: '#3b82f6',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#ffffff',
    fontSize: 16,
  },
  removeButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    padding: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  addSetButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addSetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
});
