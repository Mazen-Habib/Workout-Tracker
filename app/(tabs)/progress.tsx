import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Workout } from '../types/workout';
import {
    getPersonalRecords,
    getTotalExercises,
    getTotalVolume,
    getUniqueExercises,
    getWorkoutsByWeek,
} from '../utils/stats';
import { loadWorkouts } from '../utils/storage';

const screenWidth = Dimensions.get('window').width;

export default function ProgressScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

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
  const totalExercises = getTotalExercises(workouts);
  const totalVolume = getTotalVolume(workouts);
  const uniqueExercises = getUniqueExercises(workouts);
  const personalRecords = getPersonalRecords(workouts);
  const weeklyWorkouts = getWorkoutsByWeek(workouts);

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
        <Ionicons name="stats-chart-outline" size={64} color="#6b7280" />
        <Text style={styles.emptyTitle}>No Progress Data Yet</Text>
        <Text style={styles.emptyText}>
          Complete some workouts to see your progress!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>Keep crushing it! 💪</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Ionicons name="barbell" size={24} color="#3b82f6" />
          <Text style={styles.statNumber}>{totalWorkouts}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="fitness" size={24} color="#10b981" />
          <Text style={styles.statNumber}>{totalExercises}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Ionicons name="trophy" size={24} color="#f59e0b" />
          <Text style={styles.statNumber}>{uniqueExercises.length}</Text>
          <Text style={styles.statLabel}>Unique Exercises</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="flame" size={24} color="#ef4444" />
          <Text style={styles.statNumber}>{Math.round(totalVolume / 1000)}k</Text>
          <Text style={styles.statLabel}>Total Volume (lbs)</Text>
        </View>
      </View>

      {/* Workout Frequency Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Workout Frequency</Text>
        <Text style={styles.chartSubtitle}>Last 4 Weeks</Text>
        <BarChart
          data={{
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{ data: weeklyWorkouts }],
          }}
          width={screenWidth - 40}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#262626',
            backgroundGradientFrom: '#262626',
            backgroundGradientTo: '#262626',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForLabels: {
              fontSize: 12,
            },
          }}
          style={styles.chart}
        />
      </View>

      {/* Personal Records */}
      {personalRecords.length > 0 && (
        <View style={styles.recordsSection}>
          <Text style={styles.sectionTitle}>Personal Records 🏆</Text>
          {personalRecords.map((record, index) => (
            <View key={index} style={styles.recordCard}>
              <View style={styles.recordRank}>
                <Text style={styles.recordRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.recordInfo}>
                <Text style={styles.recordName}>{record.name}</Text>
                <Text style={styles.recordWeight}>{record.weight} lbs</Text>
              </View>
            </View>
          ))}
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
    fontSize: 16,
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
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#262626',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  chartSection: {
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  recordsSection: {
    padding: 20,
    paddingTop: 0,
  },
  recordCard: {
    flexDirection: 'row',
    backgroundColor: '#262626',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  recordRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  recordInfo: {
    flex: 1,
  },
  recordName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  recordWeight: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 2,
  },
});