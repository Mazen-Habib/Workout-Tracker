import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Exercise, ExerciseLibrary } from './types/workout';
import { loadLibrary } from './utils/storage';

const WIDTH = Dimensions.get('window').width;

export default function SelectExerciseScreen() {
  const router = useRouter();
  const { sportId, categoryId, muscleId } = useLocalSearchParams<{
    sportId: string;
    categoryId: string;
    muscleId: string;
  }>();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleName, setMuscleName] = useState<string>('');
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
      
      if (muscle) {
        setMuscleName(muscle.name);
        setExercises(muscle.exercises);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    // Proceed to the next screen (e.g., log exercise sets)
    router.push({
      pathname: '/log-exercise',
      params: {
        sportId,
        categoryId,
        muscleId,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
      },
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="barbell" size={64} color="#6b7280" />
      <Text style={styles.emptyStateText}>
        No exercises available for this muscle group.
      </Text>
    </View>
  );

  const renderExerciseCard = (exercise: Exercise) => (
    <TouchableOpacity
      key={exercise.id}
      onPress={() => handleSelectExercise(exercise)}
      activeOpacity={0.7}
      style={styles.exerciseCard}
    >
      <Text style={styles.exerciseName}>{exercise.name}</Text>
      <Ionicons name="chevron-forward" size={24} color="#3b82f6" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.title}>{muscleName} - Exercises</Text>
          <ScrollView
            contentContainerStyle={styles.exercisesList}
            scrollEnabled={exercises.length > 3}
          >
            {exercises.length === 0
              ? renderEmptyState()
              : exercises.map((exercise) =>
                  renderExerciseCard(exercise)
                )}
          </ScrollView>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  exercisesList: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  exerciseCard: {
    backgroundColor: '#262626',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  emptyStateText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    maxWidth: WIDTH - 32,
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
