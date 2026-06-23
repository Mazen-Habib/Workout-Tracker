import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import {
  AppDialog,
  Button,
  Card,
  Celebration,
  CelebrationVariant,
  FadeIn,
  IconButton,
  PressableScale,
  Text,
  TextField,
  FormModal,
} from '@/components/ui';
import { useAppDialog } from '@/hooks/use-app-dialog';
import { makeStyles, useTheme } from '@/theme';
import ExerciseHistoryCard from './components/ExerciseHistoryCard';
import { Exercise, ExerciseLibrary, Workout, WorkoutExercise } from './types/workout';
import { generateId } from './utils/helpers';
import { getExerciseBest } from './utils/stats';
import { addWorkout, loadLibrary, loadWorkouts, updateExerciseNote, updateExercisePhoto } from './utils/storage';

export default function LogExerciseScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles();
  const dialog = useAppDialog();
  const { sportId, categoryId, muscleId, exerciseId, exerciseName } = useLocalSearchParams<{
    sportId: string;
    categoryId: string;
    muscleId?: string;
    exerciseId: string;
    exerciseName: string;
  }>();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState<{ reps: string; weight: string }[]>([{ reps: '', weight: '' }]);
  const [loading, setLoading] = useState(true);
  const [takingPhoto, setTakingPhoto] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [newSetAdded, setNewSetAdded] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationVariant | null>(null);
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
      const muscle = muscleIdString ? category?.muscleGroups.find((m) => m.id === muscleIdString) : undefined;
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
    setSets((prev) => [...prev, { reps: '', weight: '' }]);
    setNewSetAdded(true);
  };

  const handleUpdateSet = (index: number, field: 'reps' | 'weight', value: string) => {
    setSets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveSet = (index: number) => {
    setSets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCompleteSet = async () => {
    try {
      const validSets = sets
        .filter((set) => set.reps.trim() !== '')
        .map((set) => ({
          id: generateId(),
          reps: parseInt(set.reps, 10),
          weight: set.weight.trim() === '' ? null : parseFloat(set.weight),
        }));

      if (validSets.length === 0) {
        dialog.alert('Add a set', 'Enter at least one set with reps before completing.');
        return;
      }

      // Detect a personal record against prior history (before saving the new one).
      const priorWorkouts = await loadWorkouts();
      const prior = getExerciseBest(priorWorkouts, exerciseIdString);
      const weights = validSets.map((s) => s.weight).filter((w): w is number => typeof w === 'number');
      const newMaxWeight = weights.length ? Math.max(...weights) : 0;
      const newMaxReps = Math.max(...validSets.map((s) => s.reps));

      let isPR = false;
      if (prior.hasHistory) {
        if (prior.hasWeight || newMaxWeight > 0) {
          isPR = newMaxWeight > prior.maxWeight;
        } else {
          isPR = newMaxReps > prior.maxReps;
        }
      }

      const workoutExercise: WorkoutExercise = {
        id: generateId(),
        exerciseId: exerciseIdString,
        exerciseName,
        muscle: exercise?.muscle || '',
        sets: validSets,
      };

      const workout: Workout = {
        id: generateId(),
        date: new Date().toISOString(),
        sport: exercise?.sport || '',
        category: exercise?.category || '',
        exercises: [workoutExercise],
      };

      await addWorkout(workout);

      // Celebrate, then return. The celebration calls back when it finishes.
      if (isPR) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      setCelebration(isPR ? 'pr' : 'complete');
    } catch (error) {
      console.error('Error saving workout:', error);
      dialog.alert('Could not save', 'Please try again.');
    }
  };

  const handleCapturePhoto = async () => {
    if (Platform.OS === 'web') {
      dialog.alert('Camera not supported', 'Camera capture is not supported on web.');
      return;
    }
    try {
      setTakingPhoto(true);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        dialog.alert('Permission needed', 'Please enable camera access to take exercise photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7 });
      if (result.canceled || result.assets.length === 0) return;
      const uri = result.assets[0].uri;
      await updateExercisePhoto(sportIdString, categoryIdString, muscleIdString || null, exerciseIdString, uri);
      setExercise((prev) => (prev ? { ...prev, photoUri: uri } : prev));
    } catch (error) {
      console.error('Error capturing exercise photo:', error);
      dialog.alert('Could not save photo', 'Please try taking the photo again.');
    } finally {
      setTakingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    dialog.confirm({
      title: 'Remove photo?',
      message: 'This will remove the current exercise photo.',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        try {
          await updateExercisePhoto(sportIdString, categoryIdString, muscleIdString || null, exerciseIdString, null);
          setExercise((prev) => (prev ? { ...prev, photoUri: undefined } : prev));
        } catch {
          dialog.alert('Could not remove photo', 'Please try again.');
        }
      },
    });
  };

  const handleSaveNote = async () => {
    try {
      setSavingNote(true);
      await updateExerciseNote(sportIdString, categoryIdString, muscleIdString || null, exerciseIdString, noteDraft);
      const trimmed = noteDraft.trim();
      setExercise((prev) => (prev ? { ...prev, note: trimmed.length > 0 ? trimmed : undefined } : prev));
      setNoteModalVisible(false);
    } catch {
      dialog.alert('Could not save note', 'Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleRemoveNote = () => {
    dialog.confirm({
      title: 'Remove note?',
      message: 'This will remove the exercise note.',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        try {
          await updateExerciseNote(sportIdString, categoryIdString, muscleIdString || null, exerciseIdString, null);
          setExercise((prev) => (prev ? { ...prev, note: undefined } : prev));
          setNoteDraft('');
        } catch {
          dialog.alert('Could not remove note', 'Please try again.');
        }
      },
    });
  };

  useEffect(() => {
    if (!newSetAdded) return;
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
          headerRight: () => (
            <View style={styles.headerActions}>
              <IconButton
                icon={takingPhoto ? 'hourglass-outline' : 'camera-outline'}
                onPress={handleCapturePhoto}
                disabled={takingPhoto}
                variant="plain"
                color={theme.colors.accent}
                accessibilityLabel="Take photo"
              />
              <IconButton
                icon="stats-chart-outline"
                onPress={() => router.push({ pathname: '/exercise-history', params: { exerciseId, exerciseName } })}
                variant="plain"
                color={theme.colors.accent}
                accessibilityLabel="Exercise history"
              />
            </View>
          ),
        }}
      />
      {loading ? (
        <View style={styles.center}>
          <Text variant="body" color="textMuted">Loading…</Text>
        </View>
      ) : (
        <ScrollView
          ref={setsScrollRef}
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (newSetAdded) setsScrollRef.current?.scrollToEnd({ animated: true });
          }}
        >
          <FadeIn>
            <Text variant="title">{exercise?.name}</Text>
            <Text variant="body" color="textSecondary" style={styles.subtitle}>
              {exercise?.muscle}
            </Text>
          </FadeIn>

          {exercise?.photoUri ? (
            <FadeIn delay={40}>
              <Card padded={false} style={styles.photoCard}>
                <Image source={{ uri: exercise.photoUri }} style={styles.exerciseImage} contentFit="cover" />
                <View style={styles.photoActions}>
                  <PressableScale onPress={handleCapturePhoto} style={[styles.photoBtn, { backgroundColor: theme.colors.overlay }]}>
                    <Ionicons name="camera" size={15} color="#fff" />
                    <Text variant="caption" color="#fff">Retake</Text>
                  </PressableScale>
                  <PressableScale onPress={handleRemovePhoto} style={[styles.photoBtn, { backgroundColor: theme.colors.danger }]}>
                    <Ionicons name="trash-outline" size={15} color="#fff" />
                    <Text variant="caption" color="#fff">Remove</Text>
                  </PressableScale>
                </View>
              </Card>
            </FadeIn>
          ) : null}

          <FadeIn delay={70}>
            <Card style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <Text variant="overline" color="textSecondary">Exercise Note</Text>
                <View style={styles.noteHeaderActions}>
                  <PressableScale onPress={() => { setNoteDraft(exercise?.note || ''); setNoteModalVisible(true); }} hitSlop={6}>
                    <Text variant="label" color="accent">{exercise?.note ? 'Edit' : 'Add'}</Text>
                  </PressableScale>
                  {exercise?.note ? (
                    <PressableScale onPress={handleRemoveNote} hitSlop={6}>
                      <Text variant="label" color="danger">Remove</Text>
                    </PressableScale>
                  ) : null}
                </View>
              </View>
              {exercise?.note ? (
                <Text variant="body" color="textSecondary" style={styles.noteBody}>{exercise.note}</Text>
              ) : (
                <Text variant="caption" color="textMuted" style={styles.noteBody}>
                  No note yet. Add cues like grip width, bench setup, or tempo.
                </Text>
              )}
            </Card>
          </FadeIn>

          <FadeIn delay={100}>
            <ExerciseHistoryCard exerciseId={exerciseId} />
          </FadeIn>

          <Text variant="subheading" style={styles.sectionTitle}>Today&apos;s Workout</Text>

          {sets.map((set, index) => (
            <FadeIn key={index} delay={index === sets.length - 1 ? 0 : undefined}>
              <Card style={styles.setCard}>
                <View style={styles.setHeader}>
                  <Text variant="bodyStrong">Set {index + 1}</Text>
                  {sets.length > 1 ? (
                    <PressableScale onPress={() => handleRemoveSet(index)} hitSlop={8}>
                      <Ionicons name="close-circle" size={22} color={theme.colors.textMuted} />
                    </PressableScale>
                  ) : null}
                </View>
                <View style={styles.inputRow}>
                  <TextField
                    label="Reps"
                    containerStyle={styles.flex}
                    placeholder="0"
                    keyboardType="number-pad"
                    value={set.reps}
                    onChangeText={(value) => handleUpdateSet(index, 'reps', value)}
                  />
                  <TextField
                    label="Weight (kg, optional)"
                    containerStyle={styles.flex}
                    placeholder="Optional"
                    keyboardType="decimal-pad"
                    value={set.weight}
                    onChangeText={(value) => handleUpdateSet(index, 'weight', value)}
                  />
                </View>
              </Card>
            </FadeIn>
          ))}

          <View style={styles.actions}>
            <Button label="Add Set" icon="add" variant="secondary" onPress={handleAddSet} style={styles.flex} />
            <Button label="Complete" icon="checkmark" onPress={handleCompleteSet} style={styles.flex} />
          </View>
        </ScrollView>
      )}

      <FormModal
        visible={noteModalVisible}
        title="Exercise Note"
        primaryLabel="Save Note"
        primaryLoading={savingNote}
        onPrimary={handleSaveNote}
        onCancel={() => setNoteModalVisible(false)}
      >
        <TextField
          placeholder="Write your persistent note for this exercise"
          multiline
          value={noteDraft}
          onChangeText={setNoteDraft}
        />
      </FormModal>

      <AppDialog {...dialog.props} />

      {celebration ? (
        <Celebration variant={celebration} onDone={() => router.back()} />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    padding: t.spacing.xl,
    paddingBottom: t.spacing['4xl'],
  },
  subtitle: {
    marginTop: t.spacing.xs,
    marginBottom: t.spacing.lg,
  },
  photoCard: {
    overflow: 'hidden',
    marginBottom: t.spacing.lg,
  },
  exerciseImage: {
    width: '100%',
    height: 180,
  },
  photoActions: {
    position: 'absolute',
    right: t.spacing.md,
    bottom: t.spacing.md,
    flexDirection: 'row',
    gap: t.spacing.sm,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    borderRadius: t.radius.sm,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
  },
  noteCard: {
    marginBottom: t.spacing.lg,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteHeaderActions: {
    flexDirection: 'row',
    gap: t.spacing.lg,
  },
  noteBody: {
    marginTop: t.spacing.md,
  },
  sectionTitle: {
    marginTop: t.spacing.sm,
    marginBottom: t.spacing.md,
  },
  setCard: {
    marginBottom: t.spacing.md,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: t.spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: t.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: t.spacing.md,
    marginTop: t.spacing.sm,
  },
}));
