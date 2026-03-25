import { AppDialog, AppDialogAction } from '@/components/ui/app-dialog';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
import { ExerciseLibrary, Sport } from './types/workout';
import { addCategory, deleteCategory, loadLibrary, updateCategoryName } from './utils/storage';

const WIDTH = Dimensions.get('window').width;

// Category icon mapping
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
  const { sportId } = useLocalSearchParams<{ sportId: string }>();
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogActions, setDialogActions] = useState<AppDialogAction[]>([]);
  
  // Handle sportId from params (could be string or array)
  const sportIdString = React.useMemo(() => {
    return Array.isArray(sportId) ? sportId[0] : sportId;
  }, [sportId]);

  // Load sport data on focus
  useFocusEffect(
    useCallback(() => {
      loadSportData();
    }, [sportIdString])
  );

  const loadSportData = async () => {
    try {
      setLoading(true);
      const library: ExerciseLibrary = await loadLibrary();
      const sport = library.sports.find((s) => s.id === sportIdString);
      setSelectedSport(sport || null);
    } catch (error) {
      console.error('Error loading sport:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    router.push({
      pathname: '/select-muscle',
      params: { sportId: sportIdString, categoryId },
    });
  };

  const handleSaveCategory = async () => {
    if (newCategoryName.trim().length === 0) {
      return;
    }

    try {
      if (selectedSport) {
        if (editingCategoryId) {
          await updateCategoryName(selectedSport.id, editingCategoryId, newCategoryName.trim());
        } else {
          await addCategory(selectedSport.id, newCategoryName.trim());
        }
        setNewCategoryName('');
        setEditingCategoryId(null);
        setModalVisible(false);
        // Reload sport data
        await loadSportData();
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleOpenAddCategory = () => {
    setEditingCategoryId(null);
    setNewCategoryName('');
    setModalVisible(true);
  };

  const handleEditCategory = (categoryId: string, categoryName: string) => {
    setEditingCategoryId(categoryId);
    setNewCategoryName(categoryName);
    setModalVisible(true);
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    if (!selectedSport) return;

    setDialogTitle(`Delete ${categoryName}?`);
    setDialogMessage('This will delete all sub categories and exercises.');
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

  const handleCategoryLongPress = (categoryId: string, categoryName: string) => {
    setDialogTitle(categoryName);
    setDialogMessage('Choose an action');
    setDialogActions([
      {
        label: 'Update Name',
        onPress: () => handleEditCategory(categoryId, categoryName),
      },
      {
        label: 'Delete Category',
        variant: 'danger',
        onPress: () => handleDeleteCategory(categoryId, categoryName),
      },
      { label: 'Cancel', variant: 'cancel' },
    ]);
    setDialogVisible(true);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="layers" size={64} color="#6b7280" />
      <Text style={styles.emptyStateText}>
        No categories yet. Add your first one!
      </Text>
    </View>
  );

  const renderCategoryCard = (categoryId: string, categoryName: string) => (
    <TouchableOpacity
      key={categoryId}
      onPress={() => handleSelectCategory(categoryId)}
        onLongPress={() => handleCategoryLongPress(categoryId, categoryName)}
      activeOpacity={0.7}
      style={styles.categoryCard}
    >
      <View style={styles.categoryIconContainer}>
        <Ionicons 
          name={getCategoryIcon(categoryName)} 
          size={28} 
          color="#3b82f6" 
        />
      </View>
      <Text style={styles.categoryName}>{categoryName}</Text>
      <Ionicons name="chevron-forward" size={24} color="#3b82f6" />
    </TouchableOpacity>
  );

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
      <Text style={styles.title}>{selectedSport?.name} - Categories</Text>
      <ScrollView
        contentContainerStyle={styles.categoriesList}
        scrollEnabled={selectedSport?.categories.length ? selectedSport.categories.length > 3 : false}
      >
        {!selectedSport || selectedSport.categories.length === 0
          ? renderEmptyState()
          : selectedSport.categories.map((category) =>
              renderCategoryCard(category.id, category.name)
            )}
      </ScrollView>

      {/* Floating Action Button - Add Category */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenAddCategory}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>

      {/* Add Category Modal */}
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
              placeholder="Enter category name (e.g., Push, Pull, Legs)"
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
                  setNewCategoryName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleSaveCategory}
              >
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
  categoriesList: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  categoryCard: {
    backgroundColor: '#262626',
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
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
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
