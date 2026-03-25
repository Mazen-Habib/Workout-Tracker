import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
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
import { ExerciseLibrary } from '../types/workout';
import {
  addSport,
  initializeDefaultLibrary,
  loadLibrary,
} from '../utils/storage';

const WIDTH = Dimensions.get('window').width;

export default function SelectSportScreen() {
  const router = useRouter();
  const [library, setLibrary] = useState<ExerciseLibrary>({ sports: [] });
  const [modalVisible, setModalVisible] = useState(false);
  const [newSportName, setNewSportName] = useState('');
  const [loading, setLoading] = useState(true);

  // Load library on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadLibraryData();
    }, [])
  );

  const loadLibraryData = async () => {
    try {
      setLoading(true);
      // Initialize default library on first load
      await initializeDefaultLibrary();
      // Load the library
      const loadedLibrary = await loadLibrary();
      setLibrary(loadedLibrary);
    } catch (error) {
      console.error('Error loading library:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSport = async () => {
    if (newSportName.trim().length === 0) {
      return;
    }

    try {
      await addSport(newSportName.trim());
      setNewSportName('');
      setModalVisible(false);
      // Reload library after adding sport
      await loadLibraryData();
    } catch (error) {
      console.error('Error adding sport:', error);
    }
  };

  const handleSelectSport = (sportId: string) => {
    router.push({
      pathname: '/select-category',
      params: { sportId },
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="barbell" size={64} color="#6b7280" />
      <Text style={styles.emptyStateText}>
        No sports added. Tap + to create your first sport.
      </Text>
    </View>
  );

  const renderSportCard = (sportId: string, sportName: string) => (
    <TouchableOpacity
      key={sportId}
      onPress={() => handleSelectSport(sportId)}
      activeOpacity={0.7}
      style={styles.sportCard}
    >
      <Text style={styles.sportName}>{sportName}</Text>
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
          <ScrollView
            contentContainerStyle={styles.sportsList}
            scrollEnabled={library.sports.length > 0}
          >
            {library.sports.length === 0
              ? renderEmptyState()
              : library.sports.map((sport) =>
                  renderSportCard(sport.id, sport.name)
                )}
          </ScrollView>

          {/* Floating Action Button - Add Sport */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={32} color="#ffffff" />
          </TouchableOpacity>

          {/* Add Sport Modal */}
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add New Sport</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter sport name (e.g., Gym, Calisthenics)"
                  placeholderTextColor="#9ca3af"
                  value={newSportName}
                  onChangeText={setNewSportName}
                  autoFocus
                />
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddSport}
                  >
                    <Text style={styles.addButtonText}>Add Sport</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  sportsList: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sportCard: {
    backgroundColor: '#262626',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sportName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
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
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    maxWidth: WIDTH - 32,
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