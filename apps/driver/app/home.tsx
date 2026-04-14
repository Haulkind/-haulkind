import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  RefreshControl,
  AppState,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../lib/AuthContext'
import { goOnline, goOffline, getActiveJob, acceptOrder, rejectOrder, getAvailableOrders, getMyOrders, type Job } from '../lib/api'

// Strip pricing info — drivers should only see items, not prices/discounts/totals
function stripPricing(text: string): string {
  if (!text) return ''
  let cleaned = text.replace(/\s*\(\$[\d,.]+\)/g, '')
  cleaned = cleaned.replace(/\s*\|\s*\d+%\s*(?:per-item\s+)?discount:\s*-?\$[\d,.]+/gi, '')
  cleaned = cleaned.replace(/\s*\|\s*Total:\s*\$[\d,.]+/gi, '')
  cleaned = cleaned.replace(/\s*\|\s*$/, '').trim()
  return cleaned
}

function formatPayout(order: Job): string {
  const ep = order.estimated_price
  if (ep && Number(ep) > 0) return Number(ep).toFixed(2)
  if (order.driver_earnings && Number(order.driver_earnings) > 0) return Number(order.driver_earnings).toFixed(2)
  if (order.payout && Number(order.payout) > 0) return Number(order.payout).toFixed(2)
  return '0.00'
}

function formatServiceType(type: string): string {
  const labels: Record<string, string> = {
    'HAUL_AWAY': '🚚 Junk Removal',
    'LABOR_ONLY': '💪 Moving Labor',
    'MATTRESS_SWAP': '🛏️ Mattress Swap',
    'FURNITURE_ASSEMBLY': '🔧 Assembly',
    'DUMPSTER_RENTAL': '🗑️ Dumpster',
    'DONATION_PICKUP': '📦 Donation',
  }
  return labels[type?.toUpperCase()] || type?.replace(/_/g, ' ') || 'Job'
}

export default function HomeScreen() {
  const router = useRouter()
  const { token, driver, logout } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [availableOrders, setAvailableOrders] = useState<Job[]>([])
  const [myOrders, setMyOrders] = useState<Job[]>([])
  const [activeJob, setActiveJob] = useState<any>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch available orders via HTTP polling (same as PWA)
  const fetchOrders = useCallback(async () => {
    if (!token) return
    try {
      const [available, my, active] = await Promise.all([
        getAvailableOrders(token).catch(() => ({ orders: [] })),
        getMyOrders(token, 'today').catch(() => ({ orders: [] })),
        getActiveJob(token).catch(() => null),
      ])
      setAvailableOrders(available.orders || [])
      setMyOrders(my.orders || [])
      setActiveJob(active)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }, [token])

  // Auto-go-online on mount + start polling
  useEffect(() => {
    if (token) {
      goOnline(token).then(() => setIsOnline(true)).catch(() => {})
    }
    fetchOrders()
    pollRef.current = setInterval(fetchOrders, 10000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchOrders])

  // Resume polling when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchOrders()
    })
    return () => sub.remove()
  }, [fetchOrders])

  const handleAcceptOrder = async (orderId: number) => {
    try {
      await acceptOrder(token!, orderId)
      setAvailableOrders(prev => prev.filter(o => o.id !== orderId))
      await fetchOrders()
      Alert.alert('Success', 'Order accepted!')
    } catch (error) {
      Alert.alert('Error', 'Failed to accept order')
    }
  }

  const handleRejectOrder = async (orderId: number) => {
    try {
      await rejectOrder(token!, orderId)
      setAvailableOrders(prev => prev.filter(o => o.id !== orderId))
    } catch (error) {
      Alert.alert('Error', 'Failed to decline order')
    }
  }

  const toggleOnlineStatus = async () => {
    setLoading(true)
    try {
      if (isOnline) {
        await goOffline(token!)
        setIsOnline(false)
      } else {
        await goOnline(token!)
        setIsOnline(true)
        fetchOrders()
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }, [fetchOrders])

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
              try { await goOffline(token!) } catch {}
            }
            if (pollRef.current) clearInterval(pollRef.current)
            await logout()
            router.replace('/auth/login')
          },
        },
      ]
    )
  }

  const renderOrderCard = ({ item: order }: { item: Job }) => {
    const serviceType = order.service_type || order.serviceType || 'HAUL_AWAY'
    const address = order.pickup_address || order.pickupAddress || 'Address not available'
    const payout = formatPayout(order)
    const desc = stripPricing(order.description || order.customer_notes || order.customerNotes || '')
    let itemPreview = ''
    if (desc.startsWith('Items:')) {
      itemPreview = desc.split('\n')[0].replace('Items:', '').trim()
    }

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderBadgeRow}>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
            <Text style={styles.orderServiceType}>{formatServiceType(serviceType)}</Text>
          </View>
          <Text style={styles.orderPayout}>${payout}</Text>
        </View>
        <Text style={styles.orderAddress} numberOfLines={1}>{address}</Text>
        {order.customer_name && (
          <Text style={styles.orderCustomer}>Customer: {order.customer_name}</Text>
        )}
        {itemPreview ? (
          <Text style={styles.orderItems} numberOfLines={1}>📋 {itemPreview}</Text>
        ) : null}
        {(order.scheduledFor || order.scheduled_for) ? (
          <Text style={styles.orderDate}>
            {new Date(order.scheduledFor || order.scheduled_for!).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
            })}
          </Text>
        ) : null}
        <View style={styles.orderActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => router.push(`/job/${order.id}`)}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
          <View style={styles.acceptRejectRow}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleRejectOrder(order.id)}
            >
              <Text style={styles.rejectButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptOrder(order.id)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  const renderMyOrderCard = ({ item: order }: { item: Job }) => {
    const serviceType = order.service_type || order.serviceType || 'HAUL_AWAY'
    const address = order.pickup_address || order.pickupAddress || 'Address not available'
    const payout = formatPayout(order)

    return (
      <TouchableOpacity
        style={styles.myOrderCard}
        onPress={() => router.push(`/job/${order.id}`)}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderServiceType}>{formatServiceType(serviceType)}</Text>
            <Text style={styles.orderStatus}>{(order.status || '').replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
          <Text style={styles.orderPayout}>${payout}</Text>
        </View>
        <Text style={styles.orderAddress} numberOfLines={1}>{address}</Text>
        <Text style={styles.orderLink}>Tap to manage →</Text>
      </TouchableOpacity>
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
            {availableOrders.length > 0 ? ` · ${availableOrders.length} new` : ''}
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

      {/* Active Job Banner */}
      {activeJob && (
        <TouchableOpacity
          style={styles.activeJobCard}
          onPress={() => router.push(`/job/${activeJob.id}`)}
        >
          <Text style={styles.activeJobTitle}>⚡ Active Job</Text>
          <Text style={styles.activeJobAddress}>{activeJob.pickupAddress || activeJob.pickup_address}</Text>
          <Text style={styles.activeJobStatus}>Status: {activeJob.status}</Text>
          <Text style={styles.activeJobLink}>Tap to view details →</Text>
        </TouchableOpacity>
      )}

      {/* Available Orders */}
      {availableOrders.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            🔴 {availableOrders.length} New Order{availableOrders.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={availableOrders}
        keyExtractor={(item) => `avail-${item.id}`}
        renderItem={renderOrderCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          myOrders.length > 0 ? (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📋 My Orders ({myOrders.length})</Text>
              </View>
              {myOrders.map((order) => (
                <View key={`my-${order.id}`}>
                  {renderMyOrderCard({ item: order })}
                </View>
              ))}
              <View style={{ height: 40 }} />
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          myOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {isOnline ? '👀 Looking for jobs nearby...\nPull down to refresh' : '⚫ Go online to receive job offers'}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
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
  sectionHeader: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  myOrderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderServiceType: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  orderPayout: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  orderAddress: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  orderCustomer: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  orderItems: {
    fontSize: 12,
    color: '#4f46e5',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  orderStatus: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 2,
  },
  orderLink: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 8,
  },
  orderActions: {
    marginTop: 8,
  },
  viewButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  acceptRejectRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  acceptButton: {
    flex: 2,
    padding: 12,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 14,
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
})
