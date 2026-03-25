import { AppDialog, AppDialogAction } from '@/components/ui/app-dialog';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ExerciseSet, Workout, WorkoutExercise } from './types/workout';
import { deleteExerciseFromWorkout, loadWorkouts } from './utils/storage';

interface ExerciseHistoryItem {
	workout: Workout;
	exercise: WorkoutExercise;
}

export default function ExerciseHistoryScreen() {
	const { exerciseId, exerciseName } = useLocalSearchParams<{
		exerciseId: string;
		exerciseName: string;
	}>();

	const [historyItems, setHistoryItems] = useState<ExerciseHistoryItem[]>([]);
	const [dialogVisible, setDialogVisible] = useState(false);
	const [dialogTitle, setDialogTitle] = useState('');
	const [dialogMessage, setDialogMessage] = useState('');
	const [dialogActions, setDialogActions] = useState<AppDialogAction[]>([]);

	const normalizedExerciseName = useMemo(() => {
		if (Array.isArray(exerciseName)) {
			return exerciseName[0] ?? 'Exercise';
		}
		return exerciseName || 'Exercise';
	}, [exerciseName]);

	const normalizedExerciseId = useMemo(() => {
		if (Array.isArray(exerciseId)) {
			return exerciseId[0] ?? '';
		}
		return exerciseId || '';
	}, [exerciseId]);

	const loadHistory = useCallback(async () => {
		try {
			const workouts = await loadWorkouts();

			const filtered = workouts
				.filter((workout) =>
					workout.exercises.some((exercise) => exercise.exerciseId === normalizedExerciseId)
				)
				.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

			const mapped = filtered
				.map((workout) => {
					const exercise = workout.exercises.find(
						(item) => item.exerciseId === normalizedExerciseId
					);
					if (!exercise) {
						return null;
					}
					return { workout, exercise };
				})
				.filter((item): item is ExerciseHistoryItem => item !== null);

			setHistoryItems(mapped);
		} catch (error) {
			console.error('Error loading exercise history:', error);
			setHistoryItems([]);
		}
	}, [normalizedExerciseId]);

	useEffect(() => {
		loadHistory();
	}, [loadHistory]);

	const handleDeleteHistoryEntry = (workout: Workout) => {
		setDialogTitle('Delete Exercise History Entry');
		setDialogMessage(
			`Delete ${normalizedExerciseName} from ${format(new Date(workout.date), 'MMM d, yyyy')}?`
		);
		setDialogActions([
			{ label: 'Cancel', variant: 'cancel' },
			{
				label: 'Delete',
				variant: 'danger',
				onPress: async () => {
					try {
						await deleteExerciseFromWorkout(workout.id, normalizedExerciseId);
						await loadHistory();
					} catch (error) {
						setDialogTitle('Error');
						setDialogMessage('Failed to delete exercise history entry');
						setDialogActions([{ label: 'OK', variant: 'cancel' }]);
						setDialogVisible(true);
					}
				},
			},
		]);
		setDialogVisible(true);
	};

	const getValidSets = (exercise: WorkoutExercise): ExerciseSet[] => {
		return Array.isArray(exercise.sets)
			? exercise.sets.filter(
					(set) => typeof set.reps === 'number' && typeof set.weight === 'number'
				)
			: [];
	};

	const getTotalVolume = (sets: ExerciseSet[]): number => {
		return sets.reduce((sum, set) => sum + set.reps * set.weight, 0);
	};

	return (
		<View style={styles.container}>
			<Stack.Screen
				options={{
					title: `${normalizedExerciseName} History`,
				}}
			/>

			{historyItems.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Ionicons name="bar-chart-outline" size={64} color="#6b7280" />
					<Text style={styles.emptyText}>
						No history for this exercise yet. Complete your first workout!
					</Text>
				</View>
			) : (
				<ScrollView contentContainerStyle={styles.scrollContent}>
					{historyItems.map(({ workout, exercise }) => {
						const sets = getValidSets(exercise);
						const totalVolume = getTotalVolume(sets);

						return (
							<View key={workout.id} style={styles.card}>
								<View style={styles.cardHeader}>
									<Text style={styles.dateText}>
										{format(new Date(workout.date), 'EEEE, MMM d, yyyy')}
									</Text>
									<TouchableOpacity
										onPress={() => handleDeleteHistoryEntry(workout)}
									>
										<Ionicons name="trash-outline" size={20} color="#ef4444" />
									</TouchableOpacity>
								</View>

								<View style={styles.setsContainer}>
									{sets.length === 0 ? (
										<Text style={styles.setText}>No sets recorded</Text>
									) : (
										sets.map((set, index) => (
											<Text key={set.id} style={styles.setText}>
												Set {index + 1}: {set.reps} reps × {set.weight} kg
											</Text>
										))
									)}
								</View>

								<Text style={styles.volumeText}>
									Total Volume: {totalVolume.toLocaleString()} kg
								</Text>
							</View>
						);
					})}
				</ScrollView>
			)}

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
	scrollContent: {
		padding: 16,
	},
	emptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	emptyText: {
		marginTop: 12,
		textAlign: 'center',
		fontSize: 16,
		color: '#9ca3af',
	},
	card: {
		backgroundColor: '#262626',
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	dateText: {
		fontSize: 18,
		fontWeight: '700',
		color: '#ffffff',
	},
	setsContainer: {
		marginTop: 12,
		marginBottom: 12,
		gap: 6,
	},
	setText: {
		fontSize: 14,
		color: '#9ca3af',
	},
	volumeText: {
		fontSize: 15,
		fontWeight: '600',
		color: '#3b82f6',
	},
});
