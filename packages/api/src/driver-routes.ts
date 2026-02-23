import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./db/index.js";
import { drivers, orders, usersTable } from "./db/schema.js";
import { eq, and, isNull, or, desc } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; name?: string };
}

// Middleware to require driver role
export const requireDriver = (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user || req.user.role !== 'driver') {
    return res.status(403).json({ error: 'Driver access required' });
  }
  next();
};

// Driver Auth - Login (uses users table)
export const driverLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email with role driver
    const [user] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.email, email), eq(usersTable.role, 'driver')))
      .limit(1);

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Find driver record
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, user.id))
      .limit(1);

    if (!driver) {
      return res.status(401).json({ error: 'Driver record not found' });
    }

    // Check if driver is blocked
    if (driver.status === 'blocked') {
      return res.status(403).json({ error: 'Driver account suspended' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: driver.id, userId: user.id, email: user.email, role: 'driver', name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      driver: {
        id: driver.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        status: driver.status,
      },
    });
  } catch (error) {
    console.error('Driver login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Driver Auth - Signup (creates user + driver)
export const driverSignup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user first
    const fullName = name || [req.body.firstName, req.body.lastName].filter(Boolean).join(' ') || 'Driver';
    const driverPhone = phone || '';

    const [newUser] = await db
      .insert(usersTable)
      .values({
        name: fullName,
        email,
        password: hashedPassword,
        phone: driverPhone,
        role: 'driver',
      })
      .returning();

    // Create driver record
    const [newDriver] = await db
      .insert(drivers)
      .values({
        userId: newUser.id,
        status: 'pending',
      })
      .returning();

    // Generate JWT token
    const token = jwt.sign(
      { id: newDriver.id, userId: newUser.id, email: newUser.email, role: 'driver', name: newUser.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      driver: {
        id: newDriver.id,
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || '',
        status: newDriver.status,
      },
    });
  } catch (error) {
    console.error('Driver signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Driver Me (get current driver info)
export const driverMe = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

    const numericId = typeof driverId === 'string' ? parseInt(driverId, 10) : driverId;

    const [result] = await db
      .select({
        id: drivers.id,
        userId: drivers.userId,
        status: drivers.status,
        userName: usersTable.name,
        userEmail: usersTable.email,
        userPhone: usersTable.phone,
      })
      .from(drivers)
      .leftJoin(usersTable, eq(drivers.userId, usersTable.id))
      .where(eq(drivers.id, numericId))
      .limit(1);

    if (!result) return res.status(404).json({ error: 'Driver not found' });

    res.json({
      driver: {
        id: result.id,
        name: result.userName || '',
        email: result.userEmail || '',
        phone: result.userPhone || '',
        status: result.status,
      },
    });
  } catch (error) {
    console.error('Driver me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Driver Profile - GET
export const getDriverProfile = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

    const numericId = typeof driverId === 'string' ? parseInt(driverId, 10) : driverId;

    const [result] = await db
      .select({
        id: drivers.id,
        userId: drivers.userId,
        status: drivers.status,
        isOnline: drivers.isOnline,
        vehicleType: drivers.vehicleType,
        userName: usersTable.name,
        userEmail: usersTable.email,
        userPhone: usersTable.phone,
      })
      .from(drivers)
      .leftJoin(usersTable, eq(drivers.userId, usersTable.id))
      .where(eq(drivers.id, numericId))
      .limit(1);

    if (!result) return res.status(404).json({ error: 'Driver not found' });

    res.json({
      driver: {
        id: result.id,
        name: result.userName || '',
        email: result.userEmail || '',
        phone: result.userPhone || '',
        status: result.status,
        isOnline: result.isOnline,
      },
    });
  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Driver Profile - PUT
export const updateDriverProfile = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

    const numericId = typeof driverId === 'string' ? parseInt(driverId, 10) : driverId;
    const { isOnline } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (isOnline !== undefined) updateData.isOnline = !!isOnline;

    const [updatedDriver] = await db
      .update(drivers)
      .set(updateData)
      .where(eq(drivers.id, numericId))
      .returning();

    // Get user info
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, updatedDriver.userId))
      .limit(1);

    res.json({
      driver: {
        id: updatedDriver.id,
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        status: updatedDriver.status,
        isOnline: updatedDriver.isOnline,
      },
    });
  } catch (error) {
    console.error('Update driver profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Safe JSON parse helper
function safeJsonParse(value: any): any {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
}

// Helper to format order for driver app
function formatOrderForDriver(order: any) {
  const pricing = safeJsonParse(order.pricingJson);
  const items = safeJsonParse(order.itemsJson);
  const fullAddress = [order.street, order.city, order.state, order.zip].filter(Boolean).join(', ');

  const totalPrice = order.totalAmount || pricing.total || pricing.estimatedPrice || 0;
  const driverEarnings = order.driverEarnings || Math.round(totalPrice * 0.70 * 100) / 100;

  return {
    id: order.id,
    service_type: order.serviceType || 'HAUL_AWAY',
    description: items.description || order.serviceType || 'Junk Removal',
    pickup_address: fullAddress,
    pickup_lat: order.lat ? parseFloat(order.lat) : null,
    pickup_lng: order.lng ? parseFloat(order.lng) : null,
    scheduled_for: order.pickupDate,
    pickup_time_window: order.pickupTimeWindow,
    status: order.status,
    estimated_price: driverEarnings,
    final_price: driverEarnings,
    driver_earnings: driverEarnings,
    volume_tier: pricing.volumeTier || items.volumeTier || null,
    customer_name: order.customerName,
    customer_phone: order.phone,
    customer_email: order.email,
    customer_notes: items.customerNotes || pricing.customerNotes || order.customerNotes || null,
    items: items.items || items.selectedItems || [],
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    assigned_driver_id: order.assignedDriverId,
    payment_status: order.paymentStatus,
    driver_payout_status: order.driverPayoutStatus,
  };
}

// Get Available Jobs
export const getAvailableJobs = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

    const numericId = typeof driverId === 'string' ? parseInt(driverId, 10) : driverId;

    // Check driver status
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, numericId))
      .limit(1);

    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    // Only approved drivers can see available orders
    if (driver.status !== 'approved' && driver.status !== 'available') {
      return res.json({
        jobs: [],
        orders: [],
        message: 'Driver must be approved to receive orders',
      });
    }

    const availableJobs = await db.select()
      .from(orders)
      .where(
        and(
          or(eq(orders.status, 'pending'), eq(orders.status, 'paid')),
          isNull(orders.assignedDriverId)
        )
      )
      .orderBy(desc(orders.createdAt));

    const formattedOrders = availableJobs.map(formatOrderForDriver);
    res.json({ jobs: formattedOrders, orders: formattedOrders });
  } catch (error) {
    console.error('Get available jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get My Jobs
export const getMyJobs = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

    const numericId = typeof driverId === 'string' ? parseInt(driverId, 10) : driverId;

    const myJobs = await db
      .select()
      .from(orders)
      .where(eq(orders.assignedDriverId, numericId))
      .orderBy(desc(orders.createdAt));

    const formattedJobs = myJobs.map(formatOrderForDriver);
    res.json({ jobs: formattedJobs, orders: formattedJobs });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Accept Job
export const acceptJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

    const numericOrderId = parseInt(id, 10);
    const numericDriverId = typeof driverId === 'string' ? parseInt(driverId, 10) : driverId;

    const [job] = await db.select().from(orders).where(eq(orders.id, numericOrderId)).limit(1);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if ((job.status !== 'pending' && job.status !== 'paid') || job.assignedDriverId) {
      return res.status(400).json({ error: 'Job is no longer available' });
    }

    const [updatedJob] = await db
      .update(orders)
      .set({ assignedDriverId: numericDriverId, status: 'assigned', updatedAt: new Date() })
      .where(eq(orders.id, numericOrderId))
      .returning();

    res.json({ job: formatOrderForDriver(updatedJob), order: formatOrderForDriver(updatedJob) });
  } catch (error) {
    console.error('Accept job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Start Job
export const startJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

    const numericOrderId = parseInt(id, 10);
    const numericDriverId = typeof driverId === 'string' ? parseInt(driverId, 10) : driverId;

    const [job] = await db.select().from(orders)
      .where(and(eq(orders.id, numericOrderId), eq(orders.assignedDriverId, numericDriverId)))
      .limit(1);

    if (!job) return res.status(404).json({ error: 'Job not found or not assigned to you' });
    if (job.status !== 'assigned') return res.status(400).json({ error: 'Job cannot be started in current status' });

    const [updatedJob] = await db
      .update(orders)
      .set({ status: 'in_progress', updatedAt: new Date() })
      .where(eq(orders.id, numericOrderId))
      .returning();

    res.json({ job: formatOrderForDriver(updatedJob), order: formatOrderForDriver(updatedJob) });
  } catch (error) {
    console.error('Start job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Complete Job
export const completeJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

    const numericOrderId = parseInt(id, 10);
    const numericDriverId = typeof driverId === 'string' ? parseInt(driverId, 10) : driverId;

    const [job] = await db.select().from(orders)
      .where(and(eq(orders.id, numericOrderId), eq(orders.assignedDriverId, numericDriverId)))
      .limit(1);

    if (!job) return res.status(404).json({ error: 'Job not found or not assigned to you' });
    if (job.status !== 'in_progress') return res.status(400).json({ error: 'Job must be in progress to complete' });

    const now = new Date();
    const [updatedJob] = await db
      .update(orders)
      .set({ status: 'completed', completedAt: now, updatedAt: now })
      .where(eq(orders.id, numericOrderId))
      .returning();

    res.json({ job: formatOrderForDriver(updatedJob), order: formatOrderForDriver(updatedJob) });
  } catch (error) {
    console.error('Complete job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Set Online Status
export const setOnlineStatus = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ error: 'Not authenticated' });

    const numericDriverId = Number(driverId);
    const { online } = req.body;

    const [updated] = await db
      .update(drivers)
      .set({ isOnline: !!online, updatedAt: new Date() })
      .where(eq(drivers.id, numericDriverId))
      .returning();

    res.json({ success: true, online: !!online, driver: updated });
  } catch (error) {
    console.error('Set online status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Order History
export const getOrderHistory = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ error: 'Not authenticated' });

    const numericDriverId = Number(driverId);
    const completedOrders = await db.select().from(orders)
      .where(and(eq(orders.assignedDriverId, numericDriverId), eq(orders.status, 'completed')))
      .orderBy(desc(orders.updatedAt));

    const formatted = completedOrders.map(formatOrderForDriver);
    res.json(formatted);
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Earnings
export const getEarnings = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ error: 'Not authenticated' });

    const numericDriverId = Number(driverId);
    const completedOrders = await db.select().from(orders)
      .where(and(eq(orders.assignedDriverId, numericDriverId), eq(orders.status, 'completed')))
      .orderBy(desc(orders.updatedAt));

    let totalEarnings = 0;
    const earningsHistory = completedOrders.map(order => {
      const pricing = safeJsonParse(order.pricingJson);
      const totalPrice = order.totalAmount || pricing?.total || pricing?.amount || 0;
      const driverAmount = order.driverEarnings || Math.round(totalPrice * 0.70 * 100) / 100;
      totalEarnings += Number(driverAmount);
      return {
        id: order.id,
        customer_name: order.customerName,
        service_type: order.serviceType,
        amount: Number(driverAmount),
        completed_at: order.updatedAt,
      };
    });

    res.json({ total_earnings: totalEarnings, completed_jobs: completedOrders.length, history: earningsHistory });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cancel Order
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

    const numericOrderId = parseInt(id, 10);
    const numericDriverId = typeof driverId === 'string' ? parseInt(driverId, 10) : driverId;

    const [job] = await db.select().from(orders)
      .where(and(eq(orders.id, numericOrderId), eq(orders.assignedDriverId, numericDriverId)))
      .limit(1);

    if (!job) return res.status(404).json({ error: 'Order not found or not assigned to you' });
    if (job.status !== 'assigned' && job.status !== 'in_progress') {
      return res.status(400).json({ error: 'Order cannot be cancelled in current status' });
    }

    const [updatedJob] = await db
      .update(orders)
      .set({ status: 'pending', assignedDriverId: null, updatedAt: new Date() })
      .where(eq(orders.id, numericOrderId))
      .returning();

    res.json({ success: true, message: 'Order cancelled successfully', job: formatOrderForDriver(updatedJob), order: formatOrderForDriver(updatedJob) });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Start Trip
export const startTrip = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

    const numericOrderId = parseInt(id, 10);
    const numericDriverId = typeof driverId === 'string' ? parseInt(driverId, 10) : driverId;

    const [job] = await db.select().from(orders)
      .where(and(eq(orders.id, numericOrderId), eq(orders.assignedDriverId, numericDriverId)))
      .limit(1);

    if (!job) return res.status(404).json({ error: 'Order not found or not assigned to you' });
    if (job.status !== 'assigned') return res.status(400).json({ error: 'Order must be assigned to start trip' });

    const [updatedJob] = await db
      .update(orders)
      .set({ status: 'in_progress', updatedAt: new Date() })
      .where(eq(orders.id, numericOrderId))
      .returning();

    res.json({ success: true, message: 'Trip started', job: formatOrderForDriver(updatedJob), order: formatOrderForDriver(updatedJob) });
  } catch (error) {
    console.error('Start trip error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
