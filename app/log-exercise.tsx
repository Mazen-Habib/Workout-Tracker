import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import ExerciseHistoryCard from './components/ExerciseHistoryCard';
import { Exercise, ExerciseLibrary, Workout, WorkoutExercise } from './types/workout';
import { generateId } from './utils/helpers';
import { addWorkout, loadLibrary, updateExerciseNote, updateExercisePhoto } from './utils/storage';

export default function LogExerciseScreen() {
  const router = useRouter();
  const { sportId, categoryId, muscleId, exerciseId, exerciseName } = useLocalSearchParams<{
    sportId: string;
    categoryId: string;
    muscleId?: string;
    exerciseId: string;
    exerciseName: string;
  }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState<{ reps: string; weight: string }[]>([
    { reps: '', weight: '' },
  ]);
  const [loading, setLoading] = useState(true);
  const [takingPhoto, setTakingPhoto] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [newSetAdded, setNewSetAdded] = useState(false);
  const setsScrollRef = useRef<ScrollView | null>(null);

  const sportIdString = Array.isArray(sportId) ? sportId[0] : sportId;
  const categoryIdString = Array.isArray(categoryId) ? categoryId[0] : categoryId;
  const muscleIdString = Array.isArray(muscleId) ? muscleId[0] : muscleId;
  const exerciseIdString = Array.isArray(exerciseId) ? exerciseId[0] : exerciseId;

  const loadExerciseData = useCallback(async () => {
    try {
      setLoading(true);
      const library: ExerciseLibrary = await loadLibrary();
      const sport = library.sports.find((s) => s.id === sportIdString);
      const category = sport?.categories.find((c) => c.id === categoryIdString);
      const muscle = muscleIdString
        ? category?.muscleGroups.find((m) => m.id === muscleIdString)
        : undefined;
      const foundExercise = muscle
        ? muscle.exercises.find((e) => e.id === exerciseIdString)
        : category?.exercises.find((e) => e.id === exerciseIdString);
      
      if (foundExercise) {
        setExercise(foundExercise);
        setNoteDraft(foundExercise.note || '');
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryIdString, exerciseIdString, muscleIdString, sportIdString]);

  useEffect(() => {
    loadExerciseData();
  }, [loadExerciseData]);

  const handleAddSet = () => {
    setSets([...sets, { reps: '', weight: '' }]);
    setNewSetAdded(true);
  };

  const handleUpdateSet = (index: number, field: 'reps' | 'weight', value: string) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const handleCompleteSet = async () => {
    try {
      // Filter valid sets
      const validSets = sets
        .filter((set) => set.reps.trim() !== '')
        .map((set) => ({
          id: generateId(),
          reps: parseInt(set.reps, 10),
          weight: set.weight.trim() === '' ? null : parseFloat(set.weight),
        }));

      // Check if there are any valid sets
      if (validSets.length === 0) {
        console.warn('No valid sets to save');
        return;
      }

      // Create workout exercise entry
      const workoutExercise: WorkoutExercise = {
        id: generateId(),
        exerciseId: exerciseIdString,
        exerciseName: exerciseName,
        muscle: exercise?.muscle || '',
        sets: validSets,
      };

      // Create complete workout entry
      const workout: Workout = {
        id: generateId(),
        date: new Date().toISOString(),
        sport: exercise?.sport || '',
        category: exercise?.category || '',
        exercises: [workoutExercise],
      };

      // Save workout to storage
      await addWorkout(workout);

      // Navigate back
      router.back();
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  const handleRemoveSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const handleCapturePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Camera not supported', 'Camera capture is not supported on web.');
      return;
    }

    try {
      setTakingPhoto(true);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please enable camera access to take exercise photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const uri = result.assets[0].uri;
      await updateExercisePhoto(
        sportIdString,
        categoryIdString,
        muscleIdString || null,
        exerciseIdString,
        uri
      );

      setExercise((prev) => (prev ? { ...prev, photoUri: uri } : prev));
    } catch (error) {
      console.error('Error capturing exercise photo:', error);
      Alert.alert('Could not save photo', 'Please try taking the photo again.');
    } finally {
      setTakingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert('Remove photo?', 'This will remove the current exercise photo.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateExercisePhoto(
              sportIdString,
              categoryIdString,
              muscleIdString || null,
              exerciseIdString,
              null
            );
            setExercise((prev) => (prev ? { ...prev, photoUri: undefined } : prev));
          } catch (error) {
            console.error('Error removing exercise photo:', error);
            Alert.alert('Could not remove photo', 'Please try again.');
          }
        },
      },
    ]);
  };

  const handleOpenNoteModal = () => {
    setNoteDraft(exercise?.note || '');
    setNoteModalVisible(true);
  };

  const handleSaveNote = async () => {
    try {
      setSavingNote(true);
      await updateExerciseNote(
        sportIdString,
        categoryIdString,
        muscleIdString || null,
        exerciseIdString,
        noteDraft
      );
      const trimmed = noteDraft.trim();
      setExercise((prev) => (prev ? { ...prev, note: trimmed.length > 0 ? trimmed : undefined } : prev));
      setNoteModalVisible(false);
    } catch (error) {
      console.error('Error saving exercise note:', error);
      Alert.alert('Could not save note', 'Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleRemoveNote = () => {
    Alert.alert('Remove note?', 'This will remove the exercise note.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateExerciseNote(
              sportIdString,
              categoryIdString,
              muscleIdString || null,
              exerciseIdString,
              null
            );
            setExercise((prev) => (prev ? { ...prev, note: undefined } : prev));
          } catch (error) {
            console.error('Error removing exercise note:', error);
            Alert.alert('Could not remove note', 'Please try again.');
          }
        },
      },
    ]);
  };

  useEffect(() => {
    if (!newSetAdded) {
      return;
    }

    // Ensure we scroll to the newest set after it is rendered.
    const timer = setTimeout(() => {
      setsScrollRef.current?.scrollToEnd({ animated: true });
      setNewSetAdded(false);
    }, 120);

    return () => clearTimeout(timer);
  }, [newSetAdded]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
      enabled={Platform.OS === 'ios'}
    >
      <Stack.Screen
        options={{
          title: exerciseName || 'Log Exercise',
          contentStyle: {
            backgroundColor: '#1a1a1a',
          },
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleCapturePhoto}
                disabled={takingPhoto}
                style={styles.headerButton}
              >
                <Ionicons name={takingPhoto ? 'hourglass' : 'camera'} size={22} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/exercise-history',
                    params: { exerciseId, exerciseName },
                  })
                }
                style={styles.headerButton}
              >
                <Ionicons name="stats-chart" size={22} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView
          ref={setsScrollRef}
          style={styles.pageScrollView}
          contentContainerStyle={styles.pageContent}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onContentSizeChange={() => {
            if (newSetAdded) {
              setsScrollRef.current?.scrollToEnd({ animated: true });
            }
          }}
        >
          <Text style={styles.title}>{exercise?.name}</Text>
          <Text style={styles.subtitle}>{exercise?.muscle}</Text>

          {exercise?.photoUri ? (
            <View style={styles.photoCard}>
                <Image source={{ uri: exercise.photoUri }} style={styles.exerciseImage} contentFit="cover" />
                <View style={styles.photoActionsRow}>
                  <TouchableOpacity style={styles.photoActionButton} onPress={handleCapturePhoto}>
                    <Ionicons name="camera" size={16} color="#dbeafe" />
                    <Text style={styles.photoActionText}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoActionButtonDanger} onPress={handleRemovePhoto}>
                    <Ionicons name="trash-outline" size={16} color="#fecaca" />
                    <Text style={styles.photoActionTextDanger}>Remove</Text>
                  </TouchableOpacity>
                </View>
            </View>
          ) : null}

          <View style={styles.noteCard}>
            <View style={styles.noteHeaderRow}>
              <Text style={styles.noteTitle}>Exercise Note</Text>
              <View style={styles.noteHeaderActions}>
                <TouchableOpacity onPress={handleOpenNoteModal} style={styles.noteActionButton}>
                  <Ionicons name="create-outline" size={16} color="#93c5fd" />
                  <Text style={styles.noteActionText}>{exercise?.note ? 'Edit' : 'Add'}</Text>
                </TouchableOpacity>
                {exercise?.note ? (
                  <TouchableOpacity onPress={handleRemoveNote} style={styles.noteActionButtonDanger}>
                    <Ionicons name="close-circle-outline" size={16} color="#fecaca" />
                    <Text style={styles.noteActionTextDanger}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            {exercise?.note ? (
              <Text style={styles.noteBody}>{exercise.note}</Text>
            ) : (
              <Text style={styles.noteEmpty}>No note yet. Add cues like grip width, bench setup, or tempo.</Text>
            )}
          </View>

          <ExerciseHistoryCard
            exerciseId={exerciseId}
          />

          <Modal
            visible={noteModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setNoteModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Exercise Note</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Write your persistent note for this exercise"
                  placeholderTextColor="#6b7280"
                  multiline
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                />
                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setNoteModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    onPress={handleSaveNote}
                    disabled={savingNote}
                  >
                    <Text style={styles.modalSaveText}>{savingNote ? 'Saving...' : 'Save Note'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Text style={styles.sectionTitle}>Today’s Workout</Text>

          <View style={styles.setsList}>
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
                    <Text style={styles.inputLabel}>Weight (kg, optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Optional"
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
          </View>

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
        </ScrollView>
      )}
    </KeyboardAvoidingView>
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
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pageScrollView: {
    flex: 1,
  },
  pageContent: {
    paddingBottom: 28,
  },
  photoCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#262626',
    borderColor: '#374151',
    borderWidth: 1,
  },
  exerciseImage: {
    width: '100%',
    height: 170,
  },
  photoActionsRow: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    gap: 8,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 64, 175, 0.75)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photoActionButtonDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(127, 29, 29, 0.78)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photoActionText: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '700',
  },
  photoActionTextDanger: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '700',
  },
  noteCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1f2937',
    padding: 14,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  noteTitle: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  noteHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  noteActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  noteActionButtonDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  noteActionText: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '600',
  },
  noteActionTextDanger: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '600',
  },
  noteBody: {
    color: '#e5e7eb',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  noteEmpty: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1f2937',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  modalTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  noteInput: {
    minHeight: 120,
    color: '#f9fafb',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 10,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  modalActionsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalSaveText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  setsList: {
    paddingTop: 4,
    paddingHorizontal: 16,
    paddingBottom: 8,
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
    paddingTop: 8,
    paddingBottom: 4,
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
