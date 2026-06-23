import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  AppDialog,
  EmptyState,
  Fab,
  FadeIn,
  FormModal,
  ListRow,
  Screen,
  Text,
  TextField,
  stagger,
} from '@/components/ui';
import { useAppDialog } from '@/hooks/use-app-dialog';
import { makeStyles } from '@/theme';
import { Exercise, ExerciseLibrary } from './types/workout';
import { addExercise, deleteExercise, loadLibrary, updateExerciseName } from './utils/storage';

export default function SelectExerciseScreen() {
  const router = useRouter();
  const styles = useStyles();
  const dialog = useAppDialog();
  const { sportId, categoryId, muscleId } = useLocalSearchParams<{
    sportId: string;
    categoryId: string;
    muscleId?: string;
  }>();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sourceName, setSourceName] = useState('');
  const [isCategoryFlow, setIsCategoryFlow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);

  const sportIdString = Array.isArray(sportId) ? sportId[0] : sportId;
  const categoryIdString = Array.isArray(categoryId) ? categoryId[0] : categoryId;
  const muscleIdString = Array.isArray(muscleId) ? muscleId[0] : muscleId;

  const loadExerciseData = useCallback(async () => {
    try {
      setLoading(true);
      const library: ExerciseLibrary = await loadLibrary();
      const sport = library.sports.find((s) => s.id === sportIdString);
      const category = sport?.categories.find((c) => c.id === categoryIdString);
      const muscle = muscleIdString ? category?.muscleGroups.find((m) => m.id === muscleIdString) : undefined;
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
  }, [sportIdString, categoryIdString, muscleIdString]);

  useFocusEffect(
    useCallback(() => {
      loadExerciseData();
    }, [loadExerciseData])
  );

  const handleSelectExercise = (exercise: Exercise) => {
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

  const resetModal = () => {
    setNewExerciseName('');
    setEditingExerciseId(null);
    setModalVisible(false);
  };

  const handleSaveExercise = async () => {
    if (newExerciseName.trim().length === 0) return;
    try {
      if (editingExerciseId) {
        await updateExerciseName(sportIdString, categoryIdString, muscleIdString || null, editingExerciseId, newExerciseName.trim());
      } else {
        await addExercise(sportIdString, categoryIdString, muscleIdString || null, newExerciseName.trim());
      }
      resetModal();
      await loadExerciseData();
    } catch (error) {
      console.error('Error saving exercise:', error);
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExerciseId(exercise.id);
    setNewExerciseName(exercise.name);
    setModalVisible(true);
  };

  const handleDeleteExercise = (exercise: Exercise) => {
    dialog.confirm({
      title: `Delete ${exercise.name}?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteExercise(sportIdString, categoryIdString, muscleIdString || null, exercise.id);
          await loadExerciseData();
        } catch {
          dialog.alert('Error', 'Failed to delete exercise');
        }
      },
    });
  };

  const handleExerciseLongPress = (exercise: Exercise) => {
    dialog.show({
      title: exercise.name,
      message: 'Choose an action',
      actions: [
        { label: 'Update Name', onPress: () => handleEditExercise(exercise) },
        { label: 'Delete', variant: 'danger', onPress: () => handleDeleteExercise(exercise) },
        { label: 'Cancel', variant: 'cancel' },
      ],
    });
  };

  return (
    <Screen scroll edgeBottom contentContainerStyle={styles.content}>
      <FadeIn>
        <Text variant="heading" style={styles.title}>
          {sourceName} · Exercises
        </Text>
      </FadeIn>

      {loading ? null : exercises.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="No exercises yet"
          description={isCategoryFlow ? 'Add an exercise to this category.' : 'Add an exercise to this muscle group.'}
        />
      ) : (
        exercises.map((exercise, index) => (
          <FadeIn key={exercise.id} delay={stagger(index)}>
            <ListRow
              icon="barbell-outline"
              title={exercise.name}
              subtitle={exercise.note ? exercise.note : undefined}
              onPress={() => handleSelectExercise(exercise)}
              onLongPress={() => handleExerciseLongPress(exercise)}
            />
          </FadeIn>
        ))
      )}

      <Fab
        icon="add"
        onPress={() => {
          setEditingExerciseId(null);
          setNewExerciseName('');
          setModalVisible(true);
        }}
        accessibilityLabel="Add exercise"
      />

      <FormModal
        visible={modalVisible}
        title={editingExerciseId ? 'Update Exercise' : 'Add Exercise'}
        primaryLabel={editingExerciseId ? 'Update' : 'Add'}
        onPrimary={handleSaveExercise}
        onCancel={resetModal}
      >
        <TextField
          placeholder="Exercise name"
          value={newExerciseName}
          onChangeText={setNewExerciseName}
          autoFocus
        />
      </FormModal>

      <AppDialog {...dialog.props} />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  content: {
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing['2xl'],
    paddingBottom: t.spacing.xl,
    flexGrow: 1,
  },
  title: {
    marginBottom: t.spacing.lg,
  },
}));
