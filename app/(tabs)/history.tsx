import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Workout } from '../types/workout';
import { deleteWorkout, loadWorkouts } from '../utils/storage';

export default function HistoryScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  // Load workouts when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadWorkoutsData();
    }, [])
  );

  const loadWorkoutsData = async () => {
    try {
      const data = await loadWorkouts();
      setWorkouts(data);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = (workoutId: string, workoutDate: string) => {
    Alert.alert(
      'Delete Workout',
      `Delete workout from ${format(new Date(workoutDate), 'MMM d, yyyy')}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorkout(workoutId);
              await loadWorkoutsData(); // Reload the list
              Alert.alert('Success', 'Workout deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete workout');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Loading...</Text>
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="barbell-outline" size={64} color="#6b7280" />
        <Text style={styles.emptyTitle}>No Workouts Yet</Text>
        <Text style={styles.emptyText}>
          Start logging your workouts to see them here!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout History</Text>
        <Text style={styles.subtitle}>{workouts.length} total workouts</Text>
      </View>

      {workouts.map((workout) => (
        <View key={workout.id} style={styles.workoutCard}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.workoutDate}>
                {format(new Date(workout.date), 'EEEE, MMM d, yyyy')}
              </Text>
              <Text style={styles.workoutTime}>
                {format(new Date(workout.date), 'h:mm a')}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => handleDeleteWorkout(workout.id, workout.date)}
            >
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color="#3b82f6" />
              <Text style={styles.statText}>{workout.duration} min</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="fitness-outline" size={18} color="#3b82f6" />
              <Text style={styles.statText}>{workout.exercises.length} exercises</Text>
            </View>
          </View>

          {/* Exercise List */}
          <View style={styles.exerciseList}>
            {workout.exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseItem}>
                <Text style={styles.exerciseNumber}>{index + 1}.</Text>
                <View style={styles.exerciseDetails}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseStats}>
                    {exercise.sets} × {exercise.reps} @ {exercise.weight} lbs
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Notes if exist */}
          {workout.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{workout.notes}</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  workoutCard: {
    backgroundColor: '#262626',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workoutDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  workoutTime: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  exerciseList: {
    gap: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    gap: 8,
  },
  exerciseNumber: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  exerciseStats: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  notesLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});