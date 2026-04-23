import { AppDialog, AppDialogAction } from '@/components/ui/app-dialog';
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
import { Exercise, ExerciseLibrary } from './types/workout';
import { addExercise, deleteExercise, loadLibrary, updateExerciseName } from './utils/storage';

const WIDTH = Dimensions.get('window').width;

export default function SelectExerciseScreen() {
  const router = useRouter();
  const { sportId, categoryId, muscleId } = useLocalSearchParams<{
    sportId: string;
    categoryId: string;
    muscleId?: string;
  }>();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sourceName, setSourceName] = useState<string>('');
  const [isCategoryFlow, setIsCategoryFlow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogActions, setDialogActions] = useState<AppDialogAction[]>([]);

  useEffect(() => {
    loadExerciseData();
  }, []);

  const sportIdString = Array.isArray(sportId) ? sportId[0] : sportId;
  const categoryIdString = Array.isArray(categoryId) ? categoryId[0] : categoryId;
  const muscleIdString = Array.isArray(muscleId) ? muscleId[0] : muscleId;

  const loadExerciseData = async () => {
    try {
      setLoading(true);
      const library: ExerciseLibrary = await loadLibrary();
      const sport = library.sports.find((s) => s.id === sportIdString);
      const category = sport?.categories.find((c) => c.id === categoryIdString);
      const muscle = muscleIdString
        ? category?.muscleGroups.find((m) => m.id === muscleIdString)
        : undefined;
      
      if (muscle) {
        setSourceName(muscle.name);
        setIsCategoryFlow(false);
        setExercises(muscle.exercises);
      } else if (category) {
        setSourceName(category.name);
        setIsCategoryFlow(true);
        setExercises(category.exercises || []);
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
        sportId: sportIdString,
        categoryId: categoryIdString,
        ...(muscleIdString ? { muscleId: muscleIdString } : {}),
        exerciseId: exercise.id,
        exerciseName: exercise.name,
      },
    });
  };

  const handleSaveExercise = async () => {
    if (newExerciseName.trim().length === 0) {
      return;
    }

    try {
      if (editingExerciseId) {
        await updateExerciseName(
          sportIdString,
          categoryIdString,
          muscleIdString || null,
          editingExerciseId,
          newExerciseName.trim()
        );
      } else {
        await addExercise(sportIdString, categoryIdString, muscleIdString || null, newExerciseName.trim());
      }
      setNewExerciseName('');
      setEditingExerciseId(null);
      setModalVisible(false);
      await loadExerciseData();
    } catch (error) {
      console.error('Error saving exercise:', error);
    }
  };

  const handleOpenAddExercise = () => {
    setEditingExerciseId(null);
    setNewExerciseName('');
    setModalVisible(true);
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExerciseId(exercise.id);
    setNewExerciseName(exercise.name);
    setModalVisible(true);
  };

  const handleDeleteExercise = (exercise: Exercise) => {
    setDialogTitle(`Delete ${exercise.name}?`);
    setDialogMessage('This action cannot be undone.');
    setDialogActions([
      { label: 'Cancel', variant: 'cancel' },
      {
        label: 'Delete',
        variant: 'danger',
        onPress: async () => {
          try {
            await deleteExercise(sportIdString, categoryIdString, muscleIdString || null, exercise.id);
            await loadExerciseData();
          } catch (error) {
            setDialogTitle('Error');
            setDialogMessage('Failed to delete exercise');
            setDialogActions([{ label: 'OK', variant: 'cancel' }]);
            setDialogVisible(true);
          }
        },
      },
    ]);
    setDialogVisible(true);
  };

  const handleExerciseLongPress = (exercise: Exercise) => {
    setDialogTitle(exercise.name);
    setDialogMessage('Choose an action');
    setDialogActions([
      { label: 'Update Name', onPress: () => handleEditExercise(exercise) },
      {
        label: 'Delete Exercise',
        variant: 'danger',
        onPress: () => handleDeleteExercise(exercise),
      },
      { label: 'Cancel', variant: 'cancel' },
    ]);
    setDialogVisible(true);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="barbell" size={64} color="#6b7280" />
      <Text style={styles.emptyStateText}>
        {isCategoryFlow
          ? 'No exercises available for this category.'
          : 'No exercises available for this muscle group.'}
      </Text>
    </View>
  );

  const renderExerciseCard = (exercise: Exercise) => (
    <TouchableOpacity
      key={exercise.id}
      onPress={() => handleSelectExercise(exercise)}
      onLongPress={() => handleExerciseLongPress(exercise)}
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
          <Text style={styles.title}>{sourceName} - Exercises</Text>
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

          <TouchableOpacity
            style={styles.fab}
            onPress={handleOpenAddExercise}
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
                <Text style={styles.modalTitle}>
                  {editingExerciseId ? 'Update Exercise Name' : 'Add New Exercise'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter exercise name"
                  placeholderTextColor="#9ca3af"
                  value={newExerciseName}
                  onChangeText={setNewExerciseName}
                  autoFocus
                />
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setModalVisible(false);
                      setEditingExerciseId(null);
                      setNewExerciseName('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleSaveExercise}
                  >
                    <Text style={styles.addButtonText}>
                      {editingExerciseId ? 'Update Exercise' : 'Add Exercise'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <AppDialog
            visible={dialogVisible}
            title={dialogTitle}
            message={dialogMessage}
            actions={dialogActions}
            onClose={() => setDialogVisible(false)}
          />
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
