import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ExerciseLibrary, Sport } from './types/workout';
import { loadLibrary } from './utils/storage';

const WIDTH = Dimensions.get('window').width;

export default function SelectCategoryScreen() {
  const router = useRouter();
  const { sportId } = useLocalSearchParams();
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadSportData();
  }, []);

  const loadSportData = async () => {
    try {
      setLoading(true);
      const library: ExerciseLibrary = await loadLibrary();
      const sport = library.sports.find((s) => s.id === sportId);
      setSelectedSport(sport || null);
    } catch (error) {
      console.error('Error loading sport:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    router.push({
      pathname: '/select-muscle-group',
      params: { sportId, categoryId },
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="layers" size={64} color="#6b7280" />
      <Text style={styles.emptyStateText}>
        No categories available for this sport.
      </Text>
    </View>
  );

  const renderCategoryCard = (categoryId: string, categoryName: string) => (
    <TouchableOpacity
      key={categoryId}
      onPress={() => handleSelectCategory(categoryId)}
      activeOpacity={0.7}
      style={styles.categoryCard}
    >
      <Text style={styles.categoryName}>{categoryName}</Text>
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
  },
  categoryName: {
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
