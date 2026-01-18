import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../lib/AuthContext'
import { completeOnboarding } from '../lib/api'

export default function OnboardingScreen() {
  const router = useRouter()
  const { token, driver, login } = useAuth()
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleCapacity, setVehicleCapacity] = useState('')
  const [liftingLimit, setLiftingLimit] = useState('')
  const [canHaulAway, setCanHaulAway] = useState(true)
  const [canLaborOnly, setCanLaborOnly] = useState(true)

  const handleComplete = async () => {
    if (!name || !phone) {
      Alert.alert('Error', 'Please enter your name and phone number')
      return
    }

    if (!canHaulAway && !canLaborOnly) {
      Alert.alert('Error', 'Please select at least one service type')
      return
    }

    setLoading(true)
    try {
      await completeOnboarding(token!, {
        name,
        phone,
        vehicleType: vehicleType || undefined,
        vehicleCapacity: vehicleCapacity || undefined,
        liftingLimit: liftingLimit ? parseInt(liftingLimit) : undefined,
        canHaulAway,
        canLaborOnly,
        documents: {
          license: 'pending',
          insurance: 'pending',
          registration: 'pending',
        },
      })

      // Update driver status
      await login(token!, { ...driver!, status: 'ACTIVE' })
      router.replace('/home')
    } catch (error) {
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>Tell us about yourself to get started</Text>

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number *"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Vehicle Type (e.g., Pickup Truck)"
            value={vehicleType}
            onChangeText={setVehicleType}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Vehicle Capacity (e.g., 1/2 Ton)"
            value={vehicleCapacity}
            onChangeText={setVehicleCapacity}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Lifting Limit (lbs)"
            value={liftingLimit}
            onChangeText={setLiftingLimit}
            keyboardType="number-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services You Can Provide</Text>
          <View style={styles.toggle}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleLabel}>Junk Removal (Haul Away)</Text>
              <Text style={styles.toggleDescription}>
                Pick up and dispose of junk
              </Text>
            </View>
            <Switch
              value={canHaulAway}
              onValueChange={setCanHaulAway}
              disabled={loading}
            />
          </View>
          <View style={styles.toggle}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleLabel}>Labor Only (Help Moving)</Text>
              <Text style={styles.toggleDescription}>
                Help customers move items
              </Text>
            </View>
            <Switch
              value={canLaborOnly}
              onValueChange={setCanLaborOnly}
              disabled={loading}
            />
          </View>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            📄 Document uploads (license, insurance, registration) can be completed later in your profile settings.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Completing...' : 'Complete Profile'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  form: {
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#666',
  },
  note: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  noteText: {
    fontSize: 14,
    color: '#1e40af',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
