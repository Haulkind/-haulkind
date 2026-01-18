import { useEffect } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../lib/AuthContext'

export default function IndexScreen() {
  const router = useRouter()
  const { token, driver, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!token) {
        router.replace('/auth/login')
      } else if (driver?.status === 'PENDING_ONBOARDING') {
        router.replace('/onboarding')
      } else {
        router.replace('/home')
      }
    }
  }, [isLoading, token, driver])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
})
