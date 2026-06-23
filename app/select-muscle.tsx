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
import { ExerciseLibrary, MuscleGroup } from './types/workout';
import { addMuscleGroup, deleteMuscleGroup, loadLibrary, updateMuscleGroupName } from './utils/storage';

export default function SelectMuscleScreen() {
  const router = useRouter();
  const styles = useStyles();
  const dialog = useAppDialog();
  const { sportId, categoryId } = useLocalSearchParams<{ sportId: string; categoryId: string }>();

  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newMuscleName, setNewMuscleName] = useState('');
  const [editingMuscleId, setEditingMuscleId] = useState<string | null>(null);

  const loadMuscleGroupData = useCallback(async () => {
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
  }, [sportId, categoryId]);

  useFocusEffect(
    useCallback(() => {
      loadMuscleGroupData();
    }, [loadMuscleGroupData])
  );

  const resetModal = () => {
    setNewMuscleName('');
    setEditingMuscleId(null);
    setModalVisible(false);
  };

  const handleSaveMuscle = async () => {
    if (newMuscleName.trim().length === 0) return;
    try {
      if (editingMuscleId) {
        await updateMuscleGroupName(sportId, categoryId, editingMuscleId, newMuscleName.trim());
      } else {
        await addMuscleGroup(sportId, categoryId, newMuscleName.trim());
      }
      resetModal();
      await loadMuscleGroupData();
    } catch (error) {
      console.error('Error saving muscle group:', error);
    }
  };

  const handleEditMuscle = (muscleId: string, muscleName: string) => {
    setEditingMuscleId(muscleId);
    setNewMuscleName(muscleName);
    setModalVisible(true);
  };

  const handleDeleteMuscle = (muscleId: string, muscleName: string) => {
    dialog.confirm({
      title: `Delete ${muscleName}?`,
      message: 'This will delete all exercises in this muscle group.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteMuscleGroup(sportId, categoryId, muscleId);
          await loadMuscleGroupData();
        } catch {
          dialog.alert('Error', 'Failed to delete muscle group');
        }
      },
    });
  };

  const handleMuscleLongPress = (muscleId: string, muscleName: string) => {
    dialog.show({
      title: muscleName,
      message: 'Choose an action',
      actions: [
        { label: 'Update Name', onPress: () => handleEditMuscle(muscleId, muscleName) },
        { label: 'Delete', variant: 'danger', onPress: () => handleDeleteMuscle(muscleId, muscleName) },
        { label: 'Cancel', variant: 'cancel' },
      ],
    });
  };

  return (
    <Screen scroll edgeBottom contentContainerStyle={styles.content}>
      <FadeIn>
        <Text variant="heading" style={styles.title}>
          {categoryName} · Muscle Groups
        </Text>
      </FadeIn>

      {loading ? null : muscleGroups.length === 0 ? (
        <EmptyState
          icon="fitness-outline"
          title="No muscle groups"
          description="Tap the + button to add one."
        />
      ) : (
        muscleGroups.map((muscle, index) => (
          <FadeIn key={muscle.id} delay={stagger(index)}>
            <ListRow
              icon="body-outline"
              title={muscle.name}
              onPress={() => router.push({ pathname: '/select-exercise', params: { sportId, categoryId, muscleId: muscle.id } })}
              onLongPress={() => handleMuscleLongPress(muscle.id, muscle.name)}
            />
          </FadeIn>
        ))
      )}

      <Fab
        icon="add"
        onPress={() => {
          setEditingMuscleId(null);
          setNewMuscleName('');
          setModalVisible(true);
        }}
        accessibilityLabel="Add muscle group"
      />

      <FormModal
        visible={modalVisible}
        title={editingMuscleId ? 'Update Muscle Group' : 'Add Muscle Group'}
        primaryLabel={editingMuscleId ? 'Update' : 'Add'}
        onPrimary={handleSaveMuscle}
        onCancel={resetModal}
      >
        <TextField
          placeholder="Muscle name (e.g. Shoulders)"
          value={newMuscleName}
          onChangeText={setNewMuscleName}
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
