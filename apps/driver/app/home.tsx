import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { useAuth } from '../lib/AuthContext'
import { goOnline, goOffline, getAvailableOrders, acceptOrder, rejectOrder, getActiveJob, getApiBaseUrl, type Job } from '../lib/api'

const POLL_INTERVAL = 10000 // Poll every 10 seconds

export default function HomeScreen() {
  const router = useRouter()
  const { token, driver, logout } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [availableOrders, setAvailableOrders] = useState<Job[]>([])
  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Request GPS permission and get real device location
  useEffect(() => {
    requestLocation()
  }, [])

  // Poll for available orders when online
  useEffect(() => {
    if (isOnline && token) {
      fetchAvailableOrders()
      pollRef.current = setInterval(fetchAvailableOrders, POLL_INTERVAL)
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [isOnline, token])

  // Check for active job on mount
  useEffect(() => {
    checkActiveJob()
  }, [])

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setLocationError('Location permission denied. Enable it in Settings.')
        console.warn('[Driver GPS] Permission denied')
        return
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude }
      setLocation(coords)
      setLocationError(null)
      console.log('[Driver GPS] Current location:', coords.lat.toFixed(6), coords.lng.toFixed(6))

      // Watch for location changes (real-time tracking)
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 100 },
        (newLoc) => {
          const newCoords = { lat: newLoc.coords.latitude, lng: newLoc.coords.longitude }
          setLocation(newCoords)
        }
      )
    } catch (err) {
      console.error('[Driver GPS] Error:', err)
      setLocationError('Failed to get GPS location')
    }
  }

  const fetchAvailableOrders = async () => {
    if (!token) return
    try {
      const orders = await getAvailableOrders(token)
      setAvailableOrders(orders)
      setError(null)
    } catch (err: any) {
      console.error('[Driver Home] Fetch orders error:', err)
      setError('Failed to load orders: ' + (err.message || 'Network error'))
    }
  }

  const checkActiveJob = async () => {
    if (!token) return
    try {
      const job = await getActiveJob(token)
      if (job) {
        setActiveJob(job)
      }
    } catch (err) {
      console.error('[Driver Home] Check active job error:', err)
    }
  }

  const toggleOnlineStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isOnline) {
        await goOffline(token!)
        setIsOnline(false)
        setAvailableOrders([])
      } else {
        await goOnline(token!)
        setIsOnline(true)
      }
    } catch (err: any) {
      console.error('[Driver Home] Toggle status error:', err)
      setError(err.message || 'Failed to update status')
      Alert.alert('Error', err.message || 'Failed to update status. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await acceptOrder(token!, orderId)
      setAvailableOrders(prev => prev.filter(o => o.id !== orderId))
      await checkActiveJob()
      Alert.alert('Success', 'Order accepted!')
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept order')
    }
  }

  const handleRejectOrder = async (orderId: string) => {
    try {
      await rejectOrder(token!, orderId)
      setAvailableOrders(prev => prev.filter(o => o.id !== orderId))
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reject order')
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchAvailableOrders(), checkActiveJob(), requestLocation()])
    setRefreshing(false)
  }, [token])

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          if (isOnline) {
            try { await goOffline(token!) } catch (_e) { /* ignore */ }
          }
          await logout()
          router.replace('/auth/login')
        },
      },
    ])
  }

  const renderOrderCard = ({ item }: { item: Job }) => {
    const price = item.payout || 0
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderType}>
            {item.serviceType === 'LABOR_ONLY' ? 'Labor Only' : 'Junk Removal'}
          </Text>
          <Text style={styles.orderPrice}>${price.toFixed(2)}</Text>
        </View>

        <View style={styles.orderDetails}>
          {item.customerName ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Customer</Text>
              <Text style={styles.detailValue}>{item.customerName}</Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{item.pickupAddress || 'Address not provided'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>{item.status}</Text>
          </View>
          {item.scheduledFor ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Scheduled</Text>
              <Text style={styles.detailValue}>{item.scheduledFor}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.orderActions}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectOrder(item.id)}
          >
            <Text style={styles.rejectButtonText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptOrder(item.id)}
          >
            <Text style={styles.acceptButtonText}>Accept ${price.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {driver?.name || 'Driver'}!</Text>
          <Text style={styles.status}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          {location ? (
            <Text style={styles.gpsText}>
              GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </Text>
          ) : locationError ? (
            <Text style={styles.gpsError}>{locationError}</Text>
          ) : (
            <Text style={styles.gpsText}>Getting GPS...</Text>
          )}
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* API URL indicator */}
      <View style={styles.apiIndicator}>
        <Text style={styles.apiText}>API: {getApiBaseUrl()}</Text>
      </View>

      {/* Error banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchAvailableOrders}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Online/Offline Toggle */}
      <TouchableOpacity
        style={[styles.toggleButton, isOnline && styles.toggleButtonOnline]}
        onPress={toggleOnlineStatus}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.toggleButtonText}>
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Active Job */}
      {activeJob ? (
        <TouchableOpacity
          style={styles.activeJobCard}
          onPress={() => router.push(('/job/' + activeJob.id) as any)}
        >
          <Text style={styles.activeJobTitle}>Active Job</Text>
          <Text style={styles.activeJobAddress}>{activeJob.pickupAddress}</Text>
          <Text style={styles.activeJobStatus}>Status: {activeJob.status}</Text>
          <Text style={styles.activeJobPayout}>Payout: ${activeJob.payout.toFixed(2)}</Text>
          <Text style={styles.activeJobLink}>Tap to view details</Text>
        </TouchableOpacity>
      ) : null}

      {/* Available Orders (REST polling) */}
      {isOnline ? (
        <View style={styles.ordersContainer}>
          <Text style={styles.ordersTitle}>
            {availableOrders.length > 0
              ? availableOrders.length + ' Available Order' + (availableOrders.length > 1 ? 's' : '')
              : 'Waiting for orders...'}
          </Text>
          <FlatList
            data={availableOrders}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderOrderCard}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Looking for jobs nearby...
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Orders refresh every 10 seconds
                </Text>
              </View>
            }
          />
        </View>
      ) : null}

      {!isOnline && !activeJob ? (
        <View style={styles.offlineState}>
          <Text style={styles.offlineStateTitle}>You are Offline</Text>
          <Text style={styles.offlineStateText}>
            Go online to start receiving job offers from customers in your area.
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  gpsText: {
    fontSize: 11,
    color: '#16a34a',
    marginTop: 2,
  },
  gpsError: {
    fontSize: 11,
    color: '#dc2626',
    marginTop: 2,
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  apiIndicator: {
    backgroundColor: '#f0fdf4',
    paddingVertical: 4,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  apiText: {
    fontSize: 10,
    color: '#16a34a',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    padding: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    flex: 1,
  },
  retryText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
    marginLeft: 12,
  },
  toggleButton: {
    margin: 24,
    padding: 20,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleButtonOnline: {
    backgroundColor: '#dc2626',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeJobCard: {
    margin: 24,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  activeJobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  activeJobAddress: {
    fontSize: 16,
    color: '#78350f',
    marginBottom: 4,
  },
  activeJobStatus: {
    fontSize: 14,
    color: '#78350f',
    marginBottom: 4,
  },
  activeJobPayout: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  activeJobLink: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  ordersContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 0,
  },
  ordersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2563eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  orderPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  orderDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    flex: 2,
    textAlign: 'right',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dc2626',
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  acceptButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  offlineState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  offlineStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 12,
  },
  offlineStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
})
