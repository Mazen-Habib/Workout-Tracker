import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Workout } from '../types/workout';
import {
    loadHomeBackgroundImage,
    loadWorkouts,
    removeHomeBackgroundImage,
    saveHomeBackgroundImage,
} from '../utils/storage';

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundUri, setBackgroundUri] = useState<string | null>(null);

  const loadHomeData = useCallback(async () => {
    try {
      const [workoutData, homeBackground] = await Promise.all([
        loadWorkouts(),
        loadHomeBackgroundImage(),
      ]);
      setWorkouts(workoutData);
      setBackgroundUri(homeBackground);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  const handlePickFromLibrary = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Enable photo library access to set a home background image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const uri = result.assets[0].uri;
      await saveHomeBackgroundImage(uri);
      setBackgroundUri(uri);
    } catch (error) {
      console.error('Error selecting home background image:', error);
      Alert.alert('Could not set background', 'Please try again.');
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Enable camera access to capture a home background image.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const uri = result.assets[0].uri;
      await saveHomeBackgroundImage(uri);
      setBackgroundUri(uri);
    } catch (error) {
      console.error('Error capturing home background image:', error);
      Alert.alert('Could not set background', 'Please try again.');
    }
  }, []);

  const handleBackgroundAction = useCallback(() => {
    const options = [
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Choose from Gallery', onPress: handlePickFromLibrary },
    ];

    if (backgroundUri) {
      options.push({
        text: 'Remove Background',
        onPress: async () => {
          try {
            await removeHomeBackgroundImage();
            setBackgroundUri(null);
          } catch (error) {
            console.error('Error removing home background image:', error);
            Alert.alert('Could not remove background', 'Please try again.');
          }
        },
      });
    }

    Alert.alert('Home Background', 'Choose an action', [
      ...options,
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [backgroundUri, handlePickFromLibrary, handleTakePhoto]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.headerIconButton} onPress={handleBackgroundAction}>
          <Ionicons name="image-outline" size={22} color="#60a5fa" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleBackgroundAction]);

  const totalWorkouts = workouts.length;
  const recentWorkouts = workouts.slice(0, 3);

  return (
    <View style={styles.container}>
      {backgroundUri ? <Image source={{ uri: backgroundUri }} style={styles.backgroundImage} contentFit="cover" /> : null}
      <View style={[StyleSheet.absoluteFillObject, styles.backgroundOverlay]} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Workout Tracker</Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={() => router.push('/log-workout')}>
          <Ionicons name="add-circle" size={24} color="#ffffff" />
          <Text style={styles.startButtonText}>Start New Workout</Text>
        </TouchableOpacity>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>

          {loading ? (
            <Text style={styles.emptyText}>Loading...</Text>
          ) : recentWorkouts.length === 0 ? (
            <Text style={styles.emptyText}>No workouts yet. Start your first one!</Text>
          ) : (
            recentWorkouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                style={styles.workoutCard}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/history',
                    params: { workoutId: workout.id },
                  })
                }
              >
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutDate}>{format(new Date(workout.date), 'MMM d, yyyy')}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#93c5fd" />
                </View>
                <Text style={styles.workoutExercises}>{workout.exercises.length} exercises</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundOverlay: {
    backgroundColor: 'rgba(248, 250, 252, 0.68)',
  },
  headerIconButton: {
    marginRight: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  date: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#60a5fa',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  recentSection: {
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  workoutCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  workoutExercises: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
});