import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

interface DriverLocation {
  lat: number
  lng: number
  updatedAt: string
}

interface JobUpdate {
  jobId: number
  status: string
  driverLocation?: DriverLocation
  eta?: number
  distance?: number
}

class SocketClient {
  private socket: Socket | null = null
  private token: string | null = null

  connect(token: string, jobId: number) {
    if (this.socket?.connected) {
      return
    }

    this.token = token
    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      query: {
        jobId,
      },
      transports: ['websocket'],
    })

    this.socket.on('connect', () => {
      console.log('Socket connected for job tracking')
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

  onJobUpdate(callback: (update: JobUpdate) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected')
    }
    this.socket.on('job_update', callback)
  }

  offJobUpdate(callback?: (update: JobUpdate) => void) {
    if (!this.socket) {
      return
    }
    if (callback) {
      this.socket.off('job_update', callback)
    } else {
      this.socket.off('job_update')
    }
  }

  onDriverLocation(callback: (location: DriverLocation) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected')
    }
    this.socket.on('driver_location', callback)
  }

  offDriverLocation(callback?: (location: DriverLocation) => void) {
    if (!this.socket) {
      return
    }
    if (callback) {
      this.socket.off('driver_location', callback)
    } else {
      this.socket.off('driver_location')
    }
  }

  onExtensionRequest(callback: (request: any) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected')
    }
    this.socket.on('extension_request', callback)
  }

  offExtensionRequest(callback?: (request: any) => void) {
    if (!this.socket) {
      return
    }
    if (callback) {
      this.socket.off('extension_request', callback)
    } else {
      this.socket.off('extension_request')
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const socketClient = new SocketClient()
