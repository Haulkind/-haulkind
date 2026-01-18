import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import type { Offer } from '../lib/api'

interface OfferCardProps {
  offer: Offer
  onAccept: () => void
  onDecline: () => void
}

export default function OfferCard({ offer, onAccept, onDecline }: OfferCardProps) {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expires = new Date(offer.expiresAt).getTime()
      const diff = Math.max(0, Math.floor((expires - now) / 1000))
      setTimeLeft(diff)
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [offer.expiresAt])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const { job } = offer

  return (
    <View style={styles.card}>
      {/* Timer */}
      <View style={[styles.timer, timeLeft < 30 && styles.timerUrgent]}>
        <Text style={styles.timerText}>⏱️ {formatTime(timeLeft)}</Text>
      </View>

      {/* Job Type */}
      <View style={styles.header}>
        <Text style={styles.jobType}>
          {job.serviceType === 'HAUL_AWAY' ? '🚚 Junk Removal' : '💪 Labor Only'}
        </Text>
        <Text style={styles.payout}>${job.payout.toFixed(2)}</Text>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍 Location</Text>
          <Text style={styles.detailValue}>{job.pickupAddress}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🚗 Distance</Text>
          <Text style={styles.detailValue}>{job.distance.toFixed(1)} mi</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>⏱️ ETA</Text>
          <Text style={styles.detailValue}>{job.eta} min</Text>
        </View>
        {job.volumeTier && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📦 Volume</Text>
            <Text style={styles.detailValue}>{job.volumeTier}</Text>
          </View>
        )}
        {job.helperCount && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>👥 Helpers</Text>
            <Text style={styles.detailValue}>{job.helperCount}</Text>
          </View>
        )}
        {job.estimatedHours && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏰ Hours</Text>
            <Text style={styles.detailValue}>{job.estimatedHours}h</Text>
          </View>
        )}
      </View>

      {/* Photos */}
      {job.photoUrls && job.photoUrls.length > 0 && (
        <View style={styles.photos}>
          {job.photoUrls.slice(0, 3).map((url, index) => (
            <Image key={index} source={{ uri: url }} style={styles.photo} />
          ))}
          {job.photoUrls.length > 3 && (
            <View style={styles.photoMore}>
              <Text style={styles.photoMoreText}>+{job.photoUrls.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {/* Notes */}
      {job.customerNotes && (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{job.customerNotes}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
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
  timer: {
    backgroundColor: '#dbeafe',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  timerUrgent: {
    backgroundColor: '#fee2e2',
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  jobType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  payout: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  details: {
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
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  photos: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  photoMore: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoMoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  notes: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#111',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dc2626',
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  acceptButton: {
    flex: 1,
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
})
