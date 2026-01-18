import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../lib/AuthContext'
import { goOnline, goOffline, getActiveJob, acceptOffer, declineOffer, type Offer } from '../lib/api'
import { socketClient } from '../lib/socket'
import OfferCard from '../components/OfferCard'

export default function HomeScreen() {
  const router = useRouter()
  const { token, driver, logout } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [offers, setOffers] = useState<Offer[]>([])
  const [activeJob, setActiveJob] = useState<any>(null)

  useEffect(() => {
    checkActiveJob()
  }, [])

  useEffect(() => {
    if (isOnline && token) {
      socketClient.connect(token)
      socketClient.onOffer(handleNewOffer)
      socketClient.onOfferExpired(handleOfferExpired)

      return () => {
        socketClient.offOffer()
        socketClient.offOfferExpired()
      }
    } else {
      socketClient.disconnect()
    }
  }, [isOnline, token])

  const checkActiveJob = async () => {
    try {
      const job = await getActiveJob(token!)
      if (job) {
        setActiveJob(job)
      }
    } catch (error) {
      console.error('Failed to check active job:', error)
    }
  }

  const handleNewOffer = (offer: Offer) => {
    setOffers(prev => [...prev, offer])
  }

  const handleOfferExpired = (jobId: number) => {
    setOffers(prev => prev.filter(offer => offer.jobId !== jobId))
  }

  const toggleOnlineStatus = async () => {
    setLoading(true)
    try {
      if (isOnline) {
        await goOffline(token!)
        setIsOnline(false)
        setOffers([])
      } else {
        await goOnline(token!)
        setIsOnline(true)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptOffer = async (jobId: number) => {
    try {
      await acceptOffer(token!, jobId)
      setOffers(prev => prev.filter(offer => offer.jobId !== jobId))
      await checkActiveJob()
      Alert.alert('Success', 'Job accepted! Check the job screen for details.')
    } catch (error) {
      Alert.alert('Error', 'Failed to accept offer')
    }
  }

  const handleDeclineOffer = async (jobId: number) => {
    try {
      await declineOffer(token!, jobId)
      setOffers(prev => prev.filter(offer => offer.jobId !== jobId))
    } catch (error) {
      Alert.alert('Error', 'Failed to decline offer')
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await checkActiveJob()
    setRefreshing(false)
  }, [])

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            if (isOnline) {
              await goOffline(token!)
            }
            await logout()
            router.replace('/auth/login')
          },
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {driver?.name || 'Driver'}!</Text>
          <Text style={styles.status}>
            {isOnline ? '🟢 Online' : '⚫ Offline'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Online/Offline Toggle */}
      <TouchableOpacity
        style={[styles.toggleButton, isOnline && styles.toggleButtonOnline]}
        onPress={toggleOnlineStatus}
        disabled={loading}
      >
        <Text style={styles.toggleButtonText}>
          {loading ? 'Updating...' : isOnline ? 'Go Offline' : 'Go Online'}
        </Text>
      </TouchableOpacity>

      {/* Active Job */}
      {activeJob && (
        <TouchableOpacity
          style={styles.activeJobCard}
          onPress={() => router.push(`/job/${activeJob.id}`)}
        >
          <Text style={styles.activeJobTitle}>Active Job</Text>
          <Text style={styles.activeJobAddress}>{activeJob.pickupAddress}</Text>
          <Text style={styles.activeJobStatus}>Status: {activeJob.status}</Text>
          <Text style={styles.activeJobLink}>Tap to view details →</Text>
        </TouchableOpacity>
      )}

      {/* Offers */}
      {isOnline && (
        <View style={styles.offersContainer}>
          <Text style={styles.offersTitle}>
            {offers.length > 0 ? `${offers.length} New Offer${offers.length > 1 ? 's' : ''}` : 'Waiting for offers...'}
          </Text>
          <FlatList
            data={offers}
            keyExtractor={(item) => item.jobId.toString()}
            renderItem={({ item }) => (
              <OfferCard
                offer={item}
                onAccept={() => handleAcceptOffer(item.jobId)}
                onDecline={() => handleDeclineOffer(item.jobId)}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {isOnline ? '👀 Looking for jobs nearby...' : '⚫ Go online to receive job offers'}
                </Text>
              </View>
            }
          />
        </View>
      )}

      {!isOnline && !activeJob && (
        <View style={styles.offlineState}>
          <Text style={styles.offlineStateTitle}>You're Offline</Text>
          <Text style={styles.offlineStateText}>
            Go online to start receiving job offers from customers in your area.
          </Text>
        </View>
      )}
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
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
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
    marginBottom: 8,
  },
  activeJobLink: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  offersContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 0,
  },
  offersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 16,
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
