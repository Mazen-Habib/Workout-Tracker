import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
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
import { Category, ExerciseLibrary, Sport } from './types/workout';
import { addCategory, deleteCategory, loadLibrary, updateCategoryName } from './utils/storage';

const getCategoryIcon = (categoryName: string): keyof typeof Ionicons.glyphMap => {
  const nameUpper = categoryName.toUpperCase();
  if (nameUpper === 'PUSH') return 'arrow-up-circle-outline';
  if (nameUpper === 'PULL') return 'arrow-down-circle-outline';
  if (nameUpper === 'LEGS') return 'walk-outline';
  if (nameUpper === 'CARDIO') return 'fitness-outline';
  if (nameUpper === 'BACK') return 'body-outline';
  if (nameUpper === 'CHEST') return 'heart-outline';
  if (nameUpper === 'ARMS') return 'barbell-outline';
  return 'layers-outline';
};

export default function SelectCategoryScreen() {
  const router = useRouter();
  const styles = useStyles();
  const dialog = useAppDialog();
  const { sportId, parentCategoryId, parentCategoryName } = useLocalSearchParams<{
    sportId: string;
    parentCategoryId?: string;
    parentCategoryName?: string;
  }>();

  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [parentForCreate, setParentForCreate] = useState<string | null>(null);

  const sportIdString = useMemo(() => (Array.isArray(sportId) ? sportId[0] : sportId), [sportId]);
  const currentParentCategoryId = useMemo(() => {
    const rawValue = Array.isArray(parentCategoryId) ? parentCategoryId[0] : parentCategoryId;
    return rawValue ?? null;
  }, [parentCategoryId]);
  const currentParentCategoryName = useMemo(
    () => (Array.isArray(parentCategoryName) ? parentCategoryName[0] : parentCategoryName),
    [parentCategoryName]
  );

  const loadSportData = useCallback(async () => {
    try {
      setLoading(true);
      const library: ExerciseLibrary = await loadLibrary();
      setSelectedSport(library.sports.find((item) => item.id === sportIdString) || null);
    } catch (error) {
      console.error('Error loading sport:', error);
    } finally {
      setLoading(false);
    }
  }, [sportIdString]);

  useFocusEffect(
    useCallback(() => {
      loadSportData();
    }, [loadSportData])
  );

  const visibleCategories = useMemo(() => {
    if (!selectedSport) return [];
    return selectedSport.categories.filter(
      (category) => (category.parentCategoryId ?? null) === currentParentCategoryId
    );
  }, [selectedSport, currentParentCategoryId]);

  const hasChildCategories = useCallback(
    (categoryId: string) =>
      selectedSport?.categories.some((category) => category.parentCategoryId === categoryId) ?? false,
    [selectedSport]
  );

  const handleSelectCategory = (category: Category) => {
    if (selectedSport?.requiresMuscleGroups) {
      router.push({ pathname: '/select-muscle', params: { sportId: sportIdString, categoryId: category.id } });
      return;
    }
    if (hasChildCategories(category.id)) {
      router.push({
        pathname: '/select-category',
        params: { sportId: sportIdString, parentCategoryId: category.id, parentCategoryName: category.name },
      });
      return;
    }
    router.push({ pathname: '/select-exercise', params: { sportId: sportIdString, categoryId: category.id } });
  };

  const resetModal = () => {
    setNewCategoryName('');
    setEditingCategoryId(null);
    setParentForCreate(null);
    setModalVisible(false);
  };

  const handleSaveCategory = async () => {
    if (!selectedSport || newCategoryName.trim().length === 0) return;
    try {
      if (editingCategoryId) {
        await updateCategoryName(selectedSport.id, editingCategoryId, newCategoryName.trim());
      } else {
        await addCategory(selectedSport.id, newCategoryName.trim(), parentForCreate);
      }
      resetModal();
      await loadSportData();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const openAddCategory = (parent: string | null) => {
    setEditingCategoryId(null);
    setParentForCreate(parent);
    setNewCategoryName('');
    setModalVisible(true);
  };

  const handleEditCategory = (categoryId: string, categoryName: string) => {
    setEditingCategoryId(categoryId);
    setParentForCreate(null);
    setNewCategoryName(categoryName);
    setModalVisible(true);
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    if (!selectedSport) return;
    dialog.confirm({
      title: `Delete ${categoryName}?`,
      message: 'This will delete all sub categories and exercises under it.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteCategory(selectedSport.id, categoryId);
          await loadSportData();
        } catch {
          dialog.alert('Error', 'Failed to delete category');
        }
      },
    });
  };

  const handleCategoryLongPress = (category: Category) => {
    dialog.show({
      title: category.name,
      message: 'Choose an action',
      actions: [
        { label: 'Add Sub Category', onPress: () => openAddCategory(category.id) },
        { label: 'Update Name', onPress: () => handleEditCategory(category.id, category.name) },
        { label: 'Delete', variant: 'danger', onPress: () => handleDeleteCategory(category.id, category.name) },
        { label: 'Cancel', variant: 'cancel' },
      ],
    });
  };

  return (
    <Screen scroll edgeBottom contentContainerStyle={styles.content}>
      <FadeIn>
        <Text variant="heading" style={styles.title}>
          {currentParentCategoryName
            ? `${currentParentCategoryName} · Sub Categories`
            : `${selectedSport?.name ?? ''} · Categories`}
        </Text>
      </FadeIn>

      {loading ? null : visibleCategories.length === 0 ? (
        <EmptyState
          icon="layers-outline"
          title={currentParentCategoryId ? 'No sub categories' : 'No categories yet'}
          description="Tap the + button to add one."
        />
      ) : (
        visibleCategories.map((category, index) => {
          const childCount = selectedSport?.categories.filter((c) => c.parentCategoryId === category.id).length || 0;
          return (
            <FadeIn key={category.id} delay={stagger(index)}>
              <ListRow
                icon={getCategoryIcon(category.name)}
                title={category.name}
                subtitle={childCount > 0 ? `${childCount} sub categories` : undefined}
                onPress={() => handleSelectCategory(category)}
                onLongPress={() => handleCategoryLongPress(category)}
              />
            </FadeIn>
          );
        })
      )}

      <Fab icon="add" onPress={() => openAddCategory(currentParentCategoryId)} accessibilityLabel="Add category" />

      <FormModal
        visible={modalVisible}
        title={editingCategoryId ? 'Update Category' : 'Add Category'}
        primaryLabel={editingCategoryId ? 'Update' : 'Add'}
        onPrimary={handleSaveCategory}
        onCancel={resetModal}
      >
        <TextField
          placeholder="Category name"
          value={newCategoryName}
          onChangeText={setNewCategoryName}
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
