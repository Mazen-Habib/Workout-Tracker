import { format } from 'date-fns';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppDialog,
  Button,
  Card,
  DonutChart,
  DonutSlice,
  EmptyState,
  FadeIn,
  IconButton,
  LineChart,
  ListRow,
  SectionHeader,
  StatCard,
  Text,
  stagger,
} from '@/components/ui';
import { useAppDialog } from '@/hooks/use-app-dialog';
import { makeStyles, useTheme, useThemeContext } from '@/theme';
import { Workout } from '../types/workout';
import { getDailyActivity, getStreak, getTopExercises, getTotalVolume, getWorkoutsByWeek } from '../utils/stats';
import {
  loadHomeBackgroundImage,
  loadWorkouts,
  removeHomeBackgroundImage,
  saveHomeBackgroundImage,
} from '../utils/storage';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const formatVolume = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`);

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useTheme();
  const { mode, toggle } = useThemeContext();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const dialog = useAppDialog();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundUri, setBackgroundUri] = useState<string | null>(null);

  const loadHomeData = useCallback(async () => {
    try {
      const [workoutData, homeBackground] = await Promise.all([loadWorkouts(), loadHomeBackgroundImage()]);
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
        dialog.alert('Permission needed', 'Enable photo library access to set a home background image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
      if (result.canceled || result.assets.length === 0) return;
      const uri = result.assets[0].uri;
      await saveHomeBackgroundImage(uri);
      setBackgroundUri(uri);
    } catch (error) {
      console.error('Error selecting home background image:', error);
      dialog.alert('Could not set background', 'Please try again.');
    }
  }, [dialog]);

  const handleTakePhoto = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        dialog.alert('Permission needed', 'Enable camera access to capture a home background image.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
      if (result.canceled || result.assets.length === 0) return;
      const uri = result.assets[0].uri;
      await saveHomeBackgroundImage(uri);
      setBackgroundUri(uri);
    } catch (error) {
      console.error('Error capturing home background image:', error);
      dialog.alert('Could not set background', 'Please try again.');
    }
  }, [dialog]);

  const handleBackgroundAction = useCallback(() => {
    const actions = [
      { label: 'Take Photo', onPress: handleTakePhoto },
      { label: 'Choose from Gallery', onPress: handlePickFromLibrary },
    ];
    if (backgroundUri) {
      actions.push({
        label: 'Remove Background',
        onPress: async () => {
          try {
            await removeHomeBackgroundImage();
            setBackgroundUri(null);
          } catch (error) {
            console.error('Error removing home background image:', error);
            dialog.alert('Could not remove background', 'Please try again.');
          }
        },
      });
    }
    dialog.show({ title: 'Home Background', message: 'Choose an action', actions: [...actions, { label: 'Cancel', variant: 'cancel' }] });
  }, [backgroundUri, handlePickFromLibrary, handleTakePhoto, dialog]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <IconButton
            icon={mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
            onPress={toggle}
            variant="plain"
            color={theme.colors.textSecondary}
            accessibilityLabel="Toggle theme"
          />
          <IconButton
            icon="image-outline"
            onPress={handleBackgroundAction}
            variant="plain"
            color={theme.colors.textSecondary}
            accessibilityLabel="Set home background"
          />
        </View>
      ),
    });
  }, [navigation, handleBackgroundAction, mode, toggle, theme, styles]);

  // ----- Derived dashboard data -----
  const daily = useMemo(() => getDailyActivity(workouts, 7), [workouts]);
  const hasVolume = useMemo(() => daily.some((d) => d.volume > 0), [daily]);
  const lineValues = useMemo(() => daily.map((d) => (hasVolume ? d.volume : d.workouts)), [daily, hasVolume]);
  const lineLabels = useMemo(() => daily.map((d) => d.label), [daily]);

  const thisWeek = useMemo(() => getWorkoutsByWeek(workouts)[3] ?? 0, [workouts]);
  const streak = useMemo(() => getStreak(workouts), [workouts]);
  const totalVolume = useMemo(() => getTotalVolume(workouts), [workouts]);

  const topExercises = useMemo(() => getTopExercises(workouts, 4), [workouts]);
  const donutData: DonutSlice[] = useMemo(
    () => topExercises.map((e, i) => ({ label: e.name, value: e.count, color: theme.colors.chart[i % theme.colors.chart.length] })),
    [topExercises, theme]
  );
  const donutTotal = useMemo(() => topExercises.reduce((s, e) => s + e.count, 0), [topExercises]);

  const recentWorkouts = workouts.slice(0, 4);

  const renderHeader = () => (
    <FadeIn>
      <View style={styles.header}>
        <Text variant="caption" color="textSecondary" style={styles.eyebrow}>
          {format(new Date(), 'EEEE, MMMM d').toUpperCase()}
        </Text>
        <Text variant="display">{greeting()}</Text>
      </View>
    </FadeIn>
  );

  return (
    <View style={styles.container}>
      {backgroundUri ? (
        <>
          <Image source={{ uri: backgroundUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={[StyleSheet.absoluteFill, styles.backgroundOverlay]} />
        </>
      ) : null}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      ) : workouts.length === 0 ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, styles.emptyContent, { paddingBottom: insets.bottom + theme.spacing['2xl'] }]}
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}
          <FadeIn delay={stagger(1)}>
            <EmptyState
              icon="barbell-outline"
              title="No workouts yet"
              description="Log your first session to unlock your dashboard with stats and charts."
            />
          </FadeIn>
          <FadeIn delay={stagger(2)}>
            <Button label="Start Workout" icon="add" onPress={() => router.push('/log-workout')} fullWidth size="lg" />
          </FadeIn>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + theme.spacing['2xl'] }]}
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}

          {/* Key metrics */}
          <FadeIn delay={stagger(1)}>
            <View style={styles.statsRow}>
              <StatCard icon="flame-outline" value={thisWeek} label="This Week" tint={theme.colors.chart[3]} />
              <StatCard icon="trending-up-outline" value={streak} label="Day Streak" tint={theme.colors.chart[2]} />
            </View>
          </FadeIn>
          <FadeIn delay={stagger(2)}>
            <View style={styles.statsRow}>
              <StatCard icon="barbell-outline" value={workouts.length} label="Workouts" tint={theme.colors.chart[0]} />
              <StatCard icon="layers-outline" value={formatVolume(totalVolume)} label="Volume (kg)" tint={theme.colors.chart[1]} />
            </View>
          </FadeIn>

          {/* Activity line chart */}
          <FadeIn delay={stagger(3)}>
            <Card style={styles.chartCard}>
              <Text variant="overline" color="textSecondary">Activity</Text>
              <Text variant="caption" color="textMuted" style={styles.chartSub}>
                {hasVolume ? 'Volume' : 'Workouts'} · last 7 days
              </Text>
              <LineChart data={lineValues} labels={lineLabels} />
            </Card>
          </FadeIn>

          {/* Exercise breakdown donut */}
          {donutTotal > 0 ? (
            <FadeIn delay={stagger(4)}>
              <Card style={styles.chartCard}>
                <Text variant="overline" color="textSecondary">Top Exercises</Text>
                <Text variant="caption" color="textMuted" style={styles.chartSub}>By frequency</Text>
                <DonutChart data={donutData} centerValue={donutTotal} centerLabel="logs" />
              </Card>
            </FadeIn>
          ) : null}

          {/* Recent activity */}
          <FadeIn delay={stagger(5)}>
            <SectionHeader title="Recent" action={{ label: 'See all', onPress: () => router.push('/history') }} style={styles.recentHeader} />
          </FadeIn>
          {recentWorkouts.map((workout, index) => (
            <FadeIn key={workout.id} delay={stagger(index, 60, 360)}>
              <ListRow
                icon="fitness-outline"
                title={format(new Date(workout.date), 'MMM d, yyyy')}
                subtitle={`${workout.exercises.length} exercise${workout.exercises.length === 1 ? '' : 's'} · ${workout.category || workout.sport}`}
                onPress={() => router.push({ pathname: '/history', params: { workoutId: workout.id } })}
              />
            </FadeIn>
          ))}

          {/* Primary action */}
          <FadeIn delay={stagger(7)}>
            <Button label="Start Workout" icon="add" onPress={() => router.push('/log-workout')} fullWidth size="lg" style={styles.startButton} />
          </FadeIn>
        </ScrollView>
      )}

      <AppDialog {...dialog.props} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  backgroundOverlay: {
    backgroundColor: t.colors.background,
    opacity: t.mode === 'dark' ? 0.85 : 0.88,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    marginRight: t.spacing.sm,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing.xl,
  },
  emptyContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: t.spacing.xl,
  },
  eyebrow: {
    marginBottom: t.spacing.sm,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: t.spacing.md,
    marginBottom: t.spacing.md,
  },
  chartCard: {
    marginTop: t.spacing.sm,
    marginBottom: t.spacing.lg,
  },
  chartSub: {
    marginTop: 2,
    marginBottom: t.spacing.md,
  },
  recentHeader: {
    marginTop: t.spacing.sm,
    marginBottom: t.spacing.md,
  },
  startButton: {
    marginTop: t.spacing.lg,
  },
}));
