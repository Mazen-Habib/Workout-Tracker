import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import {
  AppDialog,
  Button,
  Card,
  FadeIn,
  PressableScale,
  Text,
  TextField,
  stagger,
} from '@/components/ui';
import { useAppDialog } from '@/hooks/use-app-dialog';
import { makeStyles, useTheme } from '@/theme';
import { Workout } from './types/workout';
import { generateId } from './utils/helpers';
import { deleteWorkout, loadWorkouts, updateWorkout } from './utils/storage';

type EditableSet = { id: string; reps: string; weight: string };
type EditableExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscle: string;
  sets: EditableSet[];
};

export default function EditWorkoutScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles();
  const dialog = useAppDialog();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const id = Array.isArray(workoutId) ? workoutId[0] : workoutId;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<EditableExercise[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const all = await loadWorkouts();
      const found = all.find((w) => w.id === id) ?? null;
      setWorkout(found);
      if (found) {
        setExercises(
          found.exercises.map((ex) => ({
            id: ex.id,
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            muscle: ex.muscle,
            sets: (Array.isArray(ex.sets) ? ex.sets : []).map((s) => ({
              id: s.id,
              reps: typeof s.reps === 'number' ? String(s.reps) : '',
              weight: typeof s.weight === 'number' ? String(s.weight) : '',
            })),
          }))
        );
        setNotes(found.notes ?? '');
      }
    } catch (error) {
      console.error('Error loading workout:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const updateSet = (exId: string, setId: string, field: 'reps' | 'weight', value: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId
          ? { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)) }
          : ex
      )
    );
  };

  const addSet = (exId: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId ? { ...ex, sets: [...ex.sets, { id: generateId(), reps: '', weight: '' }] } : ex
      )
    );
  };

  const removeSet = (exId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === exId ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) } : ex))
    );
  };

  const removeExercise = (exId: string) => {
    dialog.confirm({
      title: 'Remove exercise?',
      message: 'This removes the exercise from this workout.',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: () => setExercises((prev) => prev.filter((ex) => ex.id !== exId)),
    });
  };

  const handleSave = async () => {
    if (!workout) return;
    try {
      setSaving(true);
      const rebuilt = exercises
        .map((ex) => ({
          id: ex.id,
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          muscle: ex.muscle,
          sets: ex.sets
            .filter((s) => s.reps.trim() !== '')
            .map((s) => ({
              id: s.id,
              reps: parseInt(s.reps, 10),
              weight: s.weight.trim() === '' ? null : parseFloat(s.weight),
            })),
        }))
        .filter((ex) => ex.sets.length > 0);

      if (rebuilt.length === 0) {
        dialog.confirm({
          title: 'Delete workout?',
          message: 'This workout has no sets left and will be deleted.',
          confirmLabel: 'Delete',
          destructive: true,
          onConfirm: async () => {
            await deleteWorkout(workout.id);
            router.back();
          },
        });
        return;
      }

      await updateWorkout({ ...workout, exercises: rebuilt, notes: notes.trim() || undefined });
      router.back();
    } catch (error) {
      console.error('Error saving workout:', error);
      dialog.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text variant="body" color="textMuted">Loading…</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.center}>
        <Text variant="body" color="textMuted">Workout not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
      enabled={Platform.OS === 'ios'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <FadeIn>
          <Text variant="caption" color="textSecondary" style={styles.eyebrow}>
            {format(new Date(workout.date), 'EEEE, MMM d, yyyy').toUpperCase()}
          </Text>
          <Text variant="title">Edit Workout</Text>
        </FadeIn>

        {exercises.map((ex, exIndex) => (
          <FadeIn key={ex.id} delay={stagger(exIndex + 1)}>
            <Card style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.flex}>
                  <Text variant="subheading">{ex.exerciseName}</Text>
                  {ex.muscle ? <Text variant="caption" color="textMuted">{ex.muscle}</Text> : null}
                </View>
                {exercises.length > 1 ? (
                  <PressableScale onPress={() => removeExercise(ex.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                  </PressableScale>
                ) : null}
              </View>

              {ex.sets.map((set, setIndex) => (
                <View key={set.id} style={styles.setBlock}>
                  <View style={styles.setHeader}>
                    <Text variant="bodyStrong">Set {setIndex + 1}</Text>
                    {ex.sets.length > 1 ? (
                      <PressableScale onPress={() => removeSet(ex.id, set.id)} hitSlop={8}>
                        <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
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
                      onChangeText={(v) => updateSet(ex.id, set.id, 'reps', v)}
                    />
                    <TextField
                      label="Weight (kg, optional)"
                      containerStyle={styles.flex}
                      placeholder="Optional"
                      keyboardType="decimal-pad"
                      value={set.weight}
                      onChangeText={(v) => updateSet(ex.id, set.id, 'weight', v)}
                    />
                  </View>
                </View>
              ))}

              <Button label="Add Set" icon="add" variant="secondary" size="sm" onPress={() => addSet(ex.id)} style={styles.addSet} />
            </Card>
          </FadeIn>
        ))}

        <FadeIn delay={stagger(exercises.length + 1)}>
          <Card style={styles.exerciseCard}>
            <Text variant="overline" color="textSecondary" style={styles.notesLabel}>Workout Note</Text>
            <TextField
              placeholder="Optional note for this workout"
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </Card>
        </FadeIn>

        <Button label="Save Changes" icon="checkmark" onPress={handleSave} loading={saving} fullWidth style={styles.save} />
      </ScrollView>

      <AppDialog {...dialog.props} />
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
    backgroundColor: t.colors.background,
  },
  content: {
    padding: t.spacing.xl,
    paddingTop: t.spacing['2xl'],
    paddingBottom: t.spacing['4xl'],
  },
  eyebrow: {
    marginBottom: t.spacing.xs,
    letterSpacing: 1,
  },
  exerciseCard: {
    marginTop: t.spacing.lg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: t.spacing.md,
    marginBottom: t.spacing.md,
  },
  setBlock: {
    marginBottom: t.spacing.md,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: t.spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: t.spacing.md,
  },
  addSet: {
    marginTop: t.spacing.xs,
    alignSelf: 'flex-start',
  },
  notesLabel: {
    marginBottom: t.spacing.sm,
  },
  save: {
    marginTop: t.spacing.xl,
  },
}));
