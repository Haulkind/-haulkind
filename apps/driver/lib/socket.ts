import { io, Socket } from 'socket.io-client'
import { Offer } from './api'

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

class SocketClient {
  private socket: Socket | null = null
  private token: string | null = null

  connect(token: string) {
    if (this.socket?.connected) {
      return
    }

    this.token = token
    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
    })

    this.socket.on('connect', () => {
      console.log('Socket connected')
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.token = null
    }
  }

  onOffer(callback: (offer: Offer) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected')
    }
    this.socket.on('offer', callback)
  }

  offOffer(callback?: (offer: Offer) => void) {
    if (!this.socket) {
      return
    }
    if (callback) {
      this.socket.off('offer', callback)
    } else {
      this.socket.off('offer')
    }
  }

  onOfferExpired(callback: (jobId: number) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected')
    }
    this.socket.on('offer_expired', callback)
  }

  offOfferExpired(callback?: (jobId: number) => void) {
    if (!this.socket) {
      return
    }
    if (callback) {
      this.socket.off('offer_expired', callback)
    } else {
      this.socket.off('offer_expired')
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const socketClient = new SocketClient()
