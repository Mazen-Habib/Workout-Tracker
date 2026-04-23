import { AppDialog, AppDialogAction } from '@/components/ui/app-dialog';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
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
import { Category, ExerciseLibrary, Sport } from './types/workout';
import { addCategory, deleteCategory, loadLibrary, updateCategoryName } from './utils/storage';

const WIDTH = Dimensions.get('window').width;

const getCategoryIcon = (categoryName: string): any => {
  const nameUpper = categoryName.toUpperCase();
  if (nameUpper === 'PUSH') return 'arrow-up-circle';
  if (nameUpper === 'PULL') return 'arrow-down-circle';
  if (nameUpper === 'LEGS') return 'walk';
  if (nameUpper === 'CARDIO') return 'fitness';
  if (nameUpper === 'BACK') return 'body';
  if (nameUpper === 'CHEST') return 'heart';
  if (nameUpper === 'ARMS') return 'fitness';
  return 'barbell';
};

export default function SelectCategoryScreen() {
  const router = useRouter();
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
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogActions, setDialogActions] = useState<AppDialogAction[]>([]);

  const sportIdString = useMemo(() => (Array.isArray(sportId) ? sportId[0] : sportId), [sportId]);
  const currentParentCategoryId = useMemo(() => {
    const rawValue = Array.isArray(parentCategoryId) ? parentCategoryId[0] : parentCategoryId;
    return rawValue ?? null;
  }, [parentCategoryId]);
  const currentParentCategoryName = useMemo(
    () => (Array.isArray(parentCategoryName) ? parentCategoryName[0] : parentCategoryName),
    [parentCategoryName]
  );

  useFocusEffect(
    useCallback(() => {
      loadSportData();
    }, [sportIdString])
  );

  const loadSportData = async () => {
    try {
      setLoading(true);
      const library: ExerciseLibrary = await loadLibrary();
      const sport = library.sports.find((item) => item.id === sportIdString);
      setSelectedSport(sport || null);
    } catch (error) {
      console.error('Error loading sport:', error);
    } finally {
      setLoading(false);
    }
  };

  const visibleCategories = useMemo(() => {
    if (!selectedSport) return [];
    return selectedSport.categories.filter(
      (category) => (category.parentCategoryId ?? null) === currentParentCategoryId
    );
  }, [selectedSport, currentParentCategoryId]);

  const hasChildCategories = useCallback(
    (categoryId: string) => {
      if (!selectedSport) return false;
      return selectedSport.categories.some((category) => category.parentCategoryId === categoryId);
    },
    [selectedSport]
  );

  const handleSelectCategory = (category: Category) => {
    if (selectedSport?.requiresMuscleGroups) {
      router.push({
        pathname: '/select-muscle',
        params: { sportId: sportIdString, categoryId: category.id },
      });
      return;
    }

    if (hasChildCategories(category.id)) {
      router.push({
        pathname: '/select-category',
        params: {
          sportId: sportIdString,
          parentCategoryId: category.id,
          parentCategoryName: category.name,
        },
      });
      return;
    }

    router.push({
      pathname: '/select-exercise',
      params: { sportId: sportIdString, categoryId: category.id },
    });
  };

  const handleSaveCategory = async () => {
    if (!selectedSport || newCategoryName.trim().length === 0) {
      return;
    }

    try {
      if (editingCategoryId) {
        await updateCategoryName(selectedSport.id, editingCategoryId, newCategoryName.trim());
      } else {
        await addCategory(selectedSport.id, newCategoryName.trim(), parentForCreate);
      }
      setNewCategoryName('');
      setEditingCategoryId(null);
      setParentForCreate(null);
      setModalVisible(false);
      await loadSportData();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleOpenAddCategory = () => {
    setEditingCategoryId(null);
    setParentForCreate(currentParentCategoryId);
    setNewCategoryName('');
    setModalVisible(true);
  };

  const handleOpenAddSubCategory = (categoryId: string) => {
    setEditingCategoryId(null);
    setParentForCreate(categoryId);
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

    setDialogTitle(`Delete ${categoryName}?`);
    setDialogMessage('This will delete all sub categories and exercises under it.');
    setDialogActions([
      { label: 'Cancel', variant: 'cancel' },
      {
        label: 'Delete',
        variant: 'danger',
        onPress: async () => {
          try {
            await deleteCategory(selectedSport.id, categoryId);
            await loadSportData();
          } catch (error) {
            setDialogTitle('Error');
            setDialogMessage('Failed to delete category');
            setDialogActions([{ label: 'OK', variant: 'cancel' }]);
            setDialogVisible(true);
          }
        },
      },
    ]);
    setDialogVisible(true);
  };

  const handleCategoryLongPress = (category: Category) => {
    setDialogTitle(category.name);
    setDialogMessage('Choose an action');
    setDialogActions([
      {
        label: 'Add Sub Category',
        onPress: () => handleOpenAddSubCategory(category.id),
      },
      {
        label: 'Update Name',
        onPress: () => handleEditCategory(category.id, category.name),
      },
      {
        label: 'Delete Category',
        variant: 'danger',
        onPress: () => handleDeleteCategory(category.id, category.name),
      },
      { label: 'Cancel', variant: 'cancel' },
    ]);
    setDialogVisible(true);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="layers" size={64} color="#6b7280" />
      <Text style={styles.emptyStateText}>
        {currentParentCategoryId
          ? 'No sub categories here yet. Add one to continue.'
          : 'No categories yet. Add your first one!'}
      </Text>
    </View>
  );

  const renderCategoryCard = (category: Category) => {
    const childCount =
      selectedSport?.categories.filter((item) => item.parentCategoryId === category.id).length || 0;

    return (
      <TouchableOpacity
        key={category.id}
        onPress={() => handleSelectCategory(category)}
        onLongPress={() => handleCategoryLongPress(category)}
        activeOpacity={0.7}
        style={styles.categoryCard}
      >
        <View style={styles.categoryIconContainer}>
          <Ionicons name={getCategoryIcon(category.name)} size={28} color="#3b82f6" />
        </View>
        <View style={styles.categoryTextContainer}>
          <Text style={styles.categoryName}>{category.name}</Text>
          {childCount > 0 && <Text style={styles.subCategoryHint}>{childCount} sub categories</Text>}
        </View>
        <Ionicons name="chevron-forward" size={24} color="#3b82f6" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {currentParentCategoryName
          ? `${currentParentCategoryName} - Sub Categories`
          : `${selectedSport?.name} - Categories`}
      </Text>
      <ScrollView contentContainerStyle={styles.categoriesList} scrollEnabled={visibleCategories.length > 3}>
        {!selectedSport || visibleCategories.length === 0
          ? renderEmptyState()
          : visibleCategories.map((category) => renderCategoryCard(category))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleOpenAddCategory} activeOpacity={0.8}>
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
              {editingCategoryId ? 'Update Category Name' : 'Add New Category'}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter category name"
              placeholderTextColor="#9ca3af"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setEditingCategoryId(null);
                  setParentForCreate(null);
                  setNewCategoryName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={handleSaveCategory}>
                <Text style={styles.addButtonText}>
                  {editingCategoryId ? 'Update Category' : 'Add Category'}
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
  categoriesList: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  subCategoryHint: {
    color: '#64748b',
    marginTop: 4,
    fontSize: 12,
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