import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { useAuth } from '../../lib/AuthContext'
import { getActiveJob, updateJobStatus, uploadPhoto, streamLocation, type Job } from '../../lib/api'

const STATUS_FLOW = ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'STARTED', 'COMPLETED']

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { token } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [beforePhotos, setBeforePhotos] = useState<string[]>([])
  const [afterPhotos, setAfterPhotos] = useState<string[]>([])
  const [receiptPhoto, setReceiptPhoto] = useState<string | null>(null)
  const [locationTracking, setLocationTracking] = useState(false)

  useEffect(() => {
    loadJob()
  }, [])

  useEffect(() => {
    let locationInterval: NodeJS.Timeout | null = null

    if (locationTracking && job) {
      // Stream location every 30 seconds
      locationInterval = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({})
          await streamLocation(
            token!,
            job.id,
            location.coords.latitude,
            location.coords.longitude
          )
        } catch (error) {
          console.error('Failed to stream location:', error)
        }
      }, 30000)
    }

    return () => {
      if (locationInterval) {
        clearInterval(locationInterval)
      }
    }
  }, [locationTracking, job])

  const loadJob = async () => {
    try {
      const jobData = await getActiveJob(token!)
      if (jobData && jobData.id === Number(id)) {
        setJob(jobData)
        
        // Start location tracking if job is in progress
        if (['EN_ROUTE', 'ARRIVED', 'STARTED'].includes(jobData.status)) {
          const { status } = await Location.requestForegroundPermissionsAsync()
          if (status === 'granted') {
            setLocationTracking(true)
          }
        }
      } else {
        Alert.alert('Error', 'Job not found')
        router.back()
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load job')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    // Validation
    if (newStatus === 'STARTED' && beforePhotos.length === 0) {
      Alert.alert('Required', 'Please upload before photos before starting the job')
      return
    }

    if (newStatus === 'COMPLETED') {
      if (afterPhotos.length === 0) {
        Alert.alert('Required', 'Please upload after photos before completing the job')
        return
      }
      if (job?.serviceType === 'HAUL_AWAY' && !receiptPhoto) {
        Alert.alert(
          'Receipt Required',
          'Please upload disposal receipt for haul away jobs',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upload Receipt', onPress: () => pickReceiptPhoto() },
          ]
        )
        return
      }
    }

    setUpdating(true)
    try {
      await updateJobStatus(token!, job!.id, newStatus)
      setJob(prev => prev ? { ...prev, status: newStatus } : null)

      if (newStatus === 'COMPLETED') {
        Alert.alert('Success', 'Job completed! Payment will be processed shortly.')
        router.replace('/home')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const pickBeforePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled) {
      const uri = result.assets[0].uri
      const url = await uploadPhoto(token!, job!.id, 'before', uri)
      setBeforePhotos(prev => [...prev, url])
    }
  }

  const pickAfterPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled) {
      const uri = result.assets[0].uri
      const url = await uploadPhoto(token!, job!.id, 'after', uri)
      setAfterPhotos(prev => [...prev, url])
    }
  }

  const pickReceiptPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled) {
      const uri = result.assets[0].uri
      const url = await uploadPhoto(token!, job!.id, 'receipt', uri)
      setReceiptPhoto(url)
    }
  }

  const openNavigation = () => {
    if (!job) return
    const url = `https://www.google.com/maps/dir/?api=1&destination=${job.pickupLat},${job.pickupLng}`
    Linking.openURL(url)
  }

  if (loading || !job) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    )
  }

  const currentStatusIndex = STATUS_FLOW.indexOf(job.status)
  const nextStatus = STATUS_FLOW[currentStatusIndex + 1]

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Job #{job.id}</Text>
      </View>

      {/* Job Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {job.serviceType === 'HAUL_AWAY' ? '🚚 Junk Removal' : '💪 Labor Only'}
        </Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={styles.infoValue}>{job.status}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Payout:</Text>
          <Text style={[styles.infoValue, styles.payout]}>${job.payout.toFixed(2)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Address:</Text>
          <Text style={styles.infoValue}>{job.pickupAddress}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Scheduled:</Text>
          <Text style={styles.infoValue}>
            {new Date(job.scheduledFor).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Navigation */}
      {['ACCEPTED', 'EN_ROUTE'].includes(job.status) && (
        <TouchableOpacity style={styles.navButton} onPress={openNavigation}>
          <Text style={styles.navButtonText}>🗺️ Open Navigation</Text>
        </TouchableOpacity>
      )}

      {/* Photos */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Photos</Text>
        
        <View style={styles.photoSection}>
          <Text style={styles.photoLabel}>Before Photos {beforePhotos.length > 0 && `(${beforePhotos.length})`}</Text>
          <TouchableOpacity style={styles.photoButton} onPress={pickBeforePhoto}>
            <Text style={styles.photoButtonText}>📷 Take Before Photo</Text>
          </TouchableOpacity>
        </View>

        {['STARTED', 'COMPLETED'].includes(job.status) && (
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>After Photos {afterPhotos.length > 0 && `(${afterPhotos.length})`}</Text>
            <TouchableOpacity style={styles.photoButton} onPress={pickAfterPhoto}>
              <Text style={styles.photoButtonText}>📷 Take After Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {job.serviceType === 'HAUL_AWAY' && job.status === 'STARTED' && (
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Disposal Receipt {receiptPhoto && '✅'}</Text>
            <TouchableOpacity style={styles.photoButton} onPress={pickReceiptPhoto}>
              <Text style={styles.photoButtonText}>📷 Upload Receipt</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Status Update */}
      {nextStatus && (
        <TouchableOpacity
          style={[styles.statusButton, updating && styles.statusButtonDisabled]}
          onPress={() => handleStatusUpdate(nextStatus)}
          disabled={updating}
        >
          <Text style={styles.statusButtonText}>
            {updating ? 'Updating...' : `Mark as ${nextStatus.replace('_', ' ')}`}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
  },
  card: {
    margin: 24,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    flex: 1,
    textAlign: 'right',
  },
  payout: {
    color: '#16a34a',
    fontSize: 18,
  },
  navButton: {
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  photoSection: {
    marginBottom: 16,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  photoButton: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  photoButtonText: {
    fontSize: 14,
    color: '#111',
  },
  statusButton: {
    marginHorizontal: 24,
    padding: 20,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    alignItems: 'center',
  },
  statusButtonDisabled: {
    opacity: 0.5,
  },
  statusButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  spacer: {
    height: 40,
  },
})
