import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ExerciseLibrary, MuscleGroup } from './types/workout';
import { addMuscleGroup, loadLibrary } from './utils/storage';

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
  const [modalVisible, setModalVisible] = useState(false);
  const [newMuscleName, setNewMuscleName] = useState('');

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

  const handleAddMuscle = async () => {
    if (newMuscleName.trim().length === 0) {
      return;
    }

    try {
      await addMuscleGroup(sportId, categoryId, newMuscleName.trim());
      setNewMuscleName('');
      setModalVisible(false);
      await loadMuscleGroupData();
    } catch (error) {
      console.error('Error adding muscle group:', error);
    }
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

          <TouchableOpacity
            style={styles.fab}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={32} color="#ffffff" />
          </TouchableOpacity>

          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add New Muscle Group</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter muscle name (e.g., Shoulders)"
                  placeholderTextColor="#9ca3af"
                  value={newMuscleName}
                  onChangeText={setNewMuscleName}
                  autoFocus
                />
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddMuscle}
                  >
                    <Text style={styles.addButtonText}>Add Muscle</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#262626',
    borderRadius: 16,
    padding: 24,
    width: Math.min(WIDTH - 32, 400),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderColor: '#3b82f6',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#ffffff',
    marginBottom: 24,
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
