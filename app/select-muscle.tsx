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
import { ExerciseLibrary, MuscleGroup } from './types/workout';
import {
    addMuscleGroup,
    deleteMuscleGroup,
    loadLibrary,
    updateMuscleGroupName,
} from './utils/storage';

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
  const [editingMuscleId, setEditingMuscleId] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogActions, setDialogActions] = useState<AppDialogAction[]>([]);

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

  const handleSaveMuscle = async () => {
    if (newMuscleName.trim().length === 0) {
      return;
    }

    try {
      if (editingMuscleId) {
        await updateMuscleGroupName(sportId, categoryId, editingMuscleId, newMuscleName.trim());
      } else {
        await addMuscleGroup(sportId, categoryId, newMuscleName.trim());
      }
      setNewMuscleName('');
      setEditingMuscleId(null);
      setModalVisible(false);
      await loadMuscleGroupData();
    } catch (error) {
      console.error('Error saving muscle group:', error);
    }
  };

  const handleOpenAddMuscle = () => {
    setEditingMuscleId(null);
    setNewMuscleName('');
    setModalVisible(true);
  };

  const handleEditMuscle = (muscleId: string, muscleName: string) => {
    setEditingMuscleId(muscleId);
    setNewMuscleName(muscleName);
    setModalVisible(true);
  };

  const handleDeleteMuscle = (muscleId: string, muscleName: string) => {
    setDialogTitle(`Delete ${muscleName}?`);
    setDialogMessage('This will delete all sub categories and exercises.');
    setDialogActions([
      { label: 'Cancel', variant: 'cancel' },
      {
        label: 'Delete',
        variant: 'danger',
        onPress: async () => {
          try {
            await deleteMuscleGroup(sportId, categoryId, muscleId);
            await loadMuscleGroupData();
          } catch (error) {
            setDialogTitle('Error');
            setDialogMessage('Failed to delete muscle group');
            setDialogActions([{ label: 'OK', variant: 'cancel' }]);
            setDialogVisible(true);
          }
        },
      },
    ]);
    setDialogVisible(true);
  };

  const handleMuscleLongPress = (muscleId: string, muscleName: string) => {
    setDialogTitle(muscleName);
    setDialogMessage('Choose an action');
    setDialogActions([
      { label: 'Update Name', onPress: () => handleEditMuscle(muscleId, muscleName) },
      {
        label: 'Delete Muscle Group',
        variant: 'danger',
        onPress: () => handleDeleteMuscle(muscleId, muscleName),
      },
      { label: 'Cancel', variant: 'cancel' },
    ]);
    setDialogVisible(true);
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
      onLongPress={() => handleMuscleLongPress(muscleId, muscleName)}
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
            onPress={handleOpenAddMuscle}
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
                  {editingMuscleId ? 'Update Muscle Group Name' : 'Add New Muscle Group'}
                </Text>
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
                    onPress={() => {
                      setModalVisible(false);
                      setEditingMuscleId(null);
                      setNewMuscleName('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleSaveMuscle}
                  >
                    <Text style={styles.addButtonText}>
                      {editingMuscleId ? 'Update Muscle' : 'Add Muscle'}
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
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  musclesList: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  muscleCard: {
    backgroundColor: '#ffffff',
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
    color: '#0f172a',
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
    color: '#64748b',
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
    color: '#0f172a',
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
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: Math.min(WIDTH - 32, 400),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#0f172a',
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
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#0f172a',
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
