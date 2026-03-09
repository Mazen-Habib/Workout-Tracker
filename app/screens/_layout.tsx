import { Stack } from 'expo-router';

const headerOptions = {
  headerStyle: {
    backgroundColor: '#1a1a1a',
  },
  headerTintColor: '#ffffff',
  headerTitleStyle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
};

export default function ScreensLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="SelectCategoryScreen"
        options={{
          ...headerOptions,
          title: 'Select Category',
        }}
      />
      <Stack.Screen
        name="SelectMuscleScreen"
        options={{
          ...headerOptions,
          title: 'Select Muscle Group',
        }}
      />
      <Stack.Screen
        name="SelectExerciseScreen"
        options={{
          ...headerOptions,
          title: 'Select Exercise',
        }}
      />
      <Stack.Screen
        name="LogExerciseScreen"
        options={{
          ...headerOptions,
          title: 'Log Exercise',
        }}
      />
    </Stack>
  );
}
