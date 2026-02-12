import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

let io: SocketIOServer | null = null;

export interface SocketUser {
  userId: number;
  role: 'customer' | 'driver' | 'admin';
  driverId?: number;
  customerId?: number;
}

// Map to track connected users
const connectedUsers = new Map<string, SocketUser>();
const driverSockets = new Map<number, string>(); // driverId -> socketId
const customerSockets = new Map<number, string>(); // customerId -> socketId
const adminSockets = new Set<string>(); // socketIds of admins

export function initializeSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // In production, specify allowed origins
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Handle authentication
    socket.on("authenticate", (data: { userId: number; role: 'customer' | 'driver' | 'admin'; driverId?: number; customerId?: number }) => {
      const user: SocketUser = {
        userId: data.userId,
        role: data.role,
        driverId: data.driverId,
        customerId: data.customerId,
      };

      connectedUsers.set(socket.id, user);

      // Track by role
      if (user.role === 'driver' && user.driverId) {
        driverSockets.set(user.driverId, socket.id);
        socket.join(`driver:${user.driverId}`);
        console.log(`[Socket.io] Driver ${user.driverId} authenticated`);
      } else if (user.role === 'customer' && user.customerId) {
        customerSockets.set(user.customerId, socket.id);
        socket.join(`customer:${user.customerId}`);
        console.log(`[Socket.io] Customer ${user.customerId} authenticated`);
      } else if (user.role === 'admin') {
        adminSockets.add(socket.id);
        socket.join('admins');
        console.log(`[Socket.io] Admin authenticated`);
      }

      socket.emit("authenticated", { success: true });
    });

    // Driver sets online/offline status
    socket.on("driver:set_status", (data: { driverId: number; isOnline: boolean }) => {
      const user = connectedUsers.get(socket.id);
      if (user?.role === 'driver') {
        socket.join(data.isOnline ? 'drivers:online' : 'drivers:offline');
        socket.leave(data.isOnline ? 'drivers:offline' : 'drivers:online');
        
        // Notify admins
        io?.to('admins').emit('driver:status_changed', {
          driverId: data.driverId,
          isOnline: data.isOnline,
        });
        
        console.log(`[Socket.io] Driver ${data.driverId} is now ${data.isOnline ? 'online' : 'offline'}`);
      }
    });

    // Driver location update
    socket.on("driver:location_update", (data: { driverId: number; lat: number; lng: number; heading?: number; speed?: number }) => {
      const user = connectedUsers.get(socket.id);
      if (user?.role === 'driver') {
        // Broadcast to admins
        io?.to('admins').emit('driver:location', data);
        
        // If driver has active job, broadcast to customer
        // (This will be enhanced when we have job assignments)
        console.log(`[Socket.io] Driver ${data.driverId} location updated: ${data.lat}, ${data.lng}`);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const user = connectedUsers.get(socket.id);
      
      if (user) {
        if (user.role === 'driver' && user.driverId) {
          driverSockets.delete(user.driverId);
          console.log(`[Socket.io] Driver ${user.driverId} disconnected`);
        } else if (user.role === 'customer' && user.customerId) {
          customerSockets.delete(user.customerId);
          console.log(`[Socket.io] Customer ${user.customerId} disconnected`);
        } else if (user.role === 'admin') {
          adminSockets.delete(socket.id);
          console.log(`[Socket.io] Admin disconnected`);
        }
        
        connectedUsers.delete(socket.id);
      }
      
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });

    // Chat messages
    socket.on("chat:send_message", (data: { jobId: string; senderId: number; message: string }) => {
      // Broadcast to all participants in the job
      io?.to(`job:${data.jobId}`).emit('chat:new_message', {
        jobId: data.jobId,
        senderId: data.senderId,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
      
      console.log(`[Socket.io] Chat message sent in job ${data.jobId}`);
    });

    // Join job room (for real-time updates)
    socket.on("job:join", (data: { jobId: string }) => {
      socket.join(`job:${data.jobId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined job room: ${data.jobId}`);
    });

    // Leave job room
    socket.on("job:leave", (data: { jobId: string }) => {
      socket.leave(`job:${data.jobId}`);
      console.log(`[Socket.io] Socket ${socket.id} left job room: ${data.jobId}`);
    });
  });

  console.log('[Socket.io] Server initialized');
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// ============================================================================
// HELPER FUNCTIONS FOR EMITTING EVENTS
// ============================================================================

/**
 * Send new job offer to specific driver
 */
export function sendJobOfferToDriver(driverId: number, jobOffer: any) {
  const socketId = driverSockets.get(driverId);
  if (socketId && io) {
    io.to(socketId).emit('job:new_offer', jobOffer);
    console.log(`[Socket.io] Sent job offer to driver ${driverId}`);
    return true;
  }
  return false;
}

/**
 * Broadcast new job to all online drivers
 */
export function broadcastJobToAllDrivers(job: any) {
  if (io) {
    io.to('drivers:online').emit('job:broadcast', job);
    console.log(`[Socket.io] Broadcasted job ${job.id} to all online drivers`);
    return true;
  }
  return false;
}

/**
 * Send job status update to customer
 */
export function sendJobUpdateToCustomer(customerId: number, update: any) {
  const socketId = customerSockets.get(customerId);
  if (socketId && io) {
    io.to(socketId).emit('job:status_update', update);
    console.log(`[Socket.io] Sent job update to customer ${customerId}`);
    return true;
  }
  return false;
}

/**
 * Send job status update to all participants (customer, driver, admins)
 */
export function broadcastJobUpdate(jobId: string, update: any) {
  if (io) {
    io.to(`job:${jobId}`).emit('job:status_update', update);
    io.to('admins').emit('job:status_update', update);
    console.log(`[Socket.io] Broadcasted job update for job ${jobId}`);
    return true;
  }
  return false;
}

/**
 * Send driver location to customer (for active job)
 */
export function sendDriverLocationToCustomer(customerId: number, location: any) {
  const socketId = customerSockets.get(customerId);
  if (socketId && io) {
    io.to(socketId).emit('driver:location', location);
    return true;
  }
  return false;
}

/**
 * Send notification to all admins
 */
export function notifyAdmins(event: string, data: any) {
  if (io) {
    io.to('admins').emit(event, data);
    console.log(`[Socket.io] Notified admins: ${event}`);
    return true;
  }
  return false;
}

/**
 * Get online driver count
 */
export function getOnlineDriverCount(): number {
  return driverSockets.size;
}

/**
 * Get connected admin count
 */
export function getConnectedAdminCount(): number {
  return adminSockets.size;
}

/**
 * Check if driver is online
 */
export function isDriverOnline(driverId: number): boolean {
  return driverSockets.has(driverId);
}

/**
 * Check if customer is connected
 */
export function isCustomerConnected(customerId: number): boolean {
  return customerSockets.has(customerId);
}
