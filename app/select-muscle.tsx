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
import { ExerciseLibrary, MuscleGroup } from './types/workout';
import { loadLibrary } from './utils/storage';

const WIDTH = Dimensions.get('window').width;

export default function SelectMuscleScreen() {
  const router = useRouter();
  const { sportId, categoryId } = useLocalSearchParams<{
    sportId: string;
    categoryId: string;
  }>();
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [categoryName, setCategoryName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMuscleGroupData();
  }, []);

  const loadMuscleGroupData = async () => {
    try {
      setLoading(true);
      const library: ExerciseLibrary = await loadLibrary();
      const sport = library.sports.find((s) => s.id === sportId);
      const category = sport?.categories.find((c) => c.id === categoryId);
      
      if (category) {
        setCategoryName(category.name);
        setMuscleGroups(category.muscleGroups);
      }
    } catch (error) {
      console.error('Error loading muscle groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMuscleGroup = (muscleId: string) => {
    router.push({
      pathname: '/select-exercise',
      params: { sportId, categoryId, muscleId },
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="fitness" size={64} color="#6b7280" />
      <Text style={styles.emptyStateText}>
        No muscle groups available for this category.
      </Text>
    </View>
  );

  const renderMuscleCard = (muscleId: string, muscleName: string) => (
    <TouchableOpacity
      key={muscleId}
      onPress={() => handleSelectMuscleGroup(muscleId)}
      activeOpacity={0.7}
      style={styles.muscleCard}
    >
      <Text style={styles.muscleName}>{muscleName}</Text>
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
          <Text style={styles.title}>{categoryName} - Muscle Groups</Text>
          <ScrollView
            contentContainerStyle={styles.musclesList}
            scrollEnabled={muscleGroups.length > 3}
          >
            {muscleGroups.length === 0
              ? renderEmptyState()
              : muscleGroups.map((muscle) =>
                  renderMuscleCard(muscle.id, muscle.name)
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
  musclesList: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  muscleCard: {
    backgroundColor: '#262626',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  muscleName: {
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
