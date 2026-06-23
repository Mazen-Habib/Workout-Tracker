import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Switch, View } from 'react-native';
import {
  AppDialog,
  EmptyState,
  Fab,
  FadeIn,
  ListRow,
  Screen,
  Text,
  TextField,
  FormModal,
  stagger,
} from '@/components/ui';
import { useAppDialog } from '@/hooks/use-app-dialog';
import { makeStyles, useTheme } from '@/theme';
import { ExerciseLibrary, Sport } from '../types/workout';
import { addSport, deleteSport, initializeDefaultLibrary, loadLibrary, updateSportName } from '../utils/storage';

export default function SelectSportScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles();
  const dialog = useAppDialog();

  const [library, setLibrary] = useState<ExerciseLibrary>({ sports: [] });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSportName, setNewSportName] = useState('');
  const [requiresMuscleGroups, setRequiresMuscleGroups] = useState(true);
  const [editingSportId, setEditingSportId] = useState<string | null>(null);

  const loadLibraryData = useCallback(async () => {
    try {
      setLoading(true);
      await initializeDefaultLibrary();
      setLibrary(await loadLibrary());
    } catch (error) {
      console.error('Error loading library:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLibraryData();
    }, [loadLibraryData])
  );

  const resetModal = () => {
    setNewSportName('');
    setRequiresMuscleGroups(true);
    setEditingSportId(null);
    setModalVisible(false);
  };

  const handleSaveSport = async () => {
    if (newSportName.trim().length === 0) return;
    try {
      if (editingSportId) {
        await updateSportName(editingSportId, newSportName.trim(), requiresMuscleGroups);
      } else {
        await addSport(newSportName.trim(), requiresMuscleGroups);
      }
      resetModal();
      await loadLibraryData();
    } catch (error) {
      console.error('Error saving sport:', error);
    }
  };

  const handleEditSport = (sport: Sport) => {
    setEditingSportId(sport.id);
    setNewSportName(sport.name);
    setRequiresMuscleGroups(sport.requiresMuscleGroups);
    setModalVisible(true);
  };

  const handleDeleteSport = (sportId: string, sportName: string) => {
    dialog.confirm({
      title: `Delete ${sportName}?`,
      message: 'This will delete all sub categories and exercises.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteSport(sportId);
          await loadLibraryData();
        } catch {
          dialog.alert('Error', 'Failed to delete sport');
        }
      },
    });
  };

  const handleSportLongPress = (sport: Sport) => {
    dialog.show({
      title: sport.name,
      message: 'Choose an action',
      actions: [
        { label: 'Update Name', onPress: () => handleEditSport(sport) },
        { label: 'Delete', variant: 'danger', onPress: () => handleDeleteSport(sport.id, sport.name) },
        { label: 'Cancel', variant: 'cancel' },
      ],
    });
  };

  return (
    <Screen scroll edgeBottom contentContainerStyle={styles.content}>
      <FadeIn>
        <Text variant="caption" color="textSecondary" style={styles.eyebrow}>
          CHOOSE A SPORT
        </Text>
        <Text variant="title" style={styles.heading}>
          Start a workout
        </Text>
      </FadeIn>

      {loading ? null : library.sports.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="No sports yet"
          description="Tap the + button to create your first sport."
        />
      ) : (
        library.sports.map((sport, index) => (
          <FadeIn key={sport.id} delay={stagger(index)}>
            <ListRow
              icon="barbell-outline"
              title={sport.name}
              subtitle={sport.requiresMuscleGroups ? 'Category → Muscle → Exercise' : 'Category → Exercise'}
              onPress={() => router.push({ pathname: '/select-category', params: { sportId: sport.id } })}
              onLongPress={() => handleSportLongPress(sport)}
            />
          </FadeIn>
        ))
      )}

      <Fab
        icon="add"
        onPress={() => {
          setEditingSportId(null);
          setNewSportName('');
          setRequiresMuscleGroups(true);
          setModalVisible(true);
        }}
        accessibilityLabel="Add sport"
      />

      <FormModal
        visible={modalVisible}
        title={editingSportId ? 'Update Sport' : 'Add Sport'}
        primaryLabel={editingSportId ? 'Update' : 'Add'}
        onPrimary={handleSaveSport}
        onCancel={resetModal}
      >
        <TextField
          placeholder="Sport name (e.g. Gym, Calisthenics)"
          value={newSportName}
          onChangeText={setNewSportName}
          autoFocus
        />
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text variant="bodyStrong">Use Muscle Groups</Text>
            <Text variant="caption" color="textSecondary">
              Turn off for flows like Calisthenics
            </Text>
          </View>
          <Switch
            value={requiresMuscleGroups}
            onValueChange={setRequiresMuscleGroups}
            thumbColor={requiresMuscleGroups ? theme.colors.accent : theme.colors.surface}
            trackColor={{ false: theme.colors.borderStrong, true: theme.colors.accentBorder }}
          />
        </View>
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
  eyebrow: {
    letterSpacing: 1,
    marginBottom: t.spacing.xs,
  },
  heading: {
    marginBottom: t.spacing.xl,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: t.spacing.lg,
    gap: t.spacing.md,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
}));
