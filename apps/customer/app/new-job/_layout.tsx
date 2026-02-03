import { Stack } from 'expo-router';

export default function NewJobLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="service" />
    </Stack>
  );
}
