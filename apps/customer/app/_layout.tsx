import { Stack } from 'expo-router'
import { AuthProvider } from '../lib/AuthContextFixed'
import { JobProvider } from '../lib/JobContext'

export default function RootLayout() {
  return (
    <AuthProvider>
      <JobProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="home" />
          <Stack.Screen name="new-job/service" />
          <Stack.Screen name="new-job/haul-away/location" />
          <Stack.Screen name="new-job/haul-away/volume" />
          <Stack.Screen name="new-job/haul-away/addons" />
          <Stack.Screen name="new-job/haul-away/photos" />
          <Stack.Screen name="new-job/haul-away/summary" />
          <Stack.Screen name="new-job/labor-only/location" />
          <Stack.Screen name="new-job/labor-only/hours" />
          <Stack.Screen name="new-job/labor-only/details" />
          <Stack.Screen name="new-job/labor-only/summary" />
          <Stack.Screen name="job/[id]" />
          <Stack.Screen name="receipt/[id]" />
          <Stack.Screen name="support" />
        </Stack>
      </JobProvider>
    </AuthProvider>
  )
}
