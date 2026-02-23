import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Workout } from '../types/workout';
import { loadWorkouts } from '../utils/storage';

export default function HomeScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  // Load workouts when screen appears
  // Load workouts when screen appears AND when it comes into focus
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

  // Calculate stats
  const totalWorkouts = workouts.length;
  const recentWorkouts = workouts.slice(0, 3); // Get last 3 workouts

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Workout Tracker</Text>
        <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalWorkouts}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>
      </View>

      {/* Start Workout Button */}
      <TouchableOpacity 
        style={styles.startButton}
        onPress={() => router.push('/log-workout')}
      >
        <Ionicons name="add-circle" size={24} color="#ffffff" />
        <Text style={styles.startButtonText}>Start New Workout</Text>
      </TouchableOpacity>

      {/* Recent Workouts Section */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        
        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : recentWorkouts.length === 0 ? (
          <Text style={styles.emptyText}>No workouts yet. Start your first one!</Text>
        ) : (
          recentWorkouts.map((workout) => (
            <View key={workout.id} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutDate}>
                  {format(new Date(workout.date), 'MMM d, yyyy')}
                </Text>
                <Text style={styles.workoutDuration}>{workout.duration} min</Text>
              </View>
              <Text style={styles.workoutExercises}>
                {workout.exercises.length} exercises
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  date: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#262626',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  recentSection: {
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  workoutCard: {
    backgroundColor: '#262626',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  workoutDuration: {
    fontSize: 14,
    color: '#3b82f6',
  },
  workoutExercises: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});