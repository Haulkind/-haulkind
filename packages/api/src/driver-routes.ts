import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./db/index.js";
import { drivers, orders } from "./db/schema.js";
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

// Driver Auth - Login
export const driverLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find driver by email
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.email, email))
      .limit(1);

    if (!driver) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if driver is approved
    if (driver.status !== 'approved') {
      return res.status(403).json({ error: 'Driver account not approved', status: driver.status });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, driver.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: driver.id, email: driver.email, role: 'driver', name: driver.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        status: driver.status,
      },
    });
  } catch (error) {
    console.error('Driver login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Driver Auth - Signup
export const driverSignup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, address, city, state, zipCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if driver already exists
    const existing = await db
      .select()
      .from(drivers)
      .where(eq(drivers.email, email))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create driver with pending status
    const fullName = name || [req.body.firstName, req.body.lastName].filter(Boolean).join(' ') || email;
    const driverPhone = phone || '';

    const [newDriver] = await db
      .insert(drivers)
      .values({
        name: fullName,
        email,
        phone: driverPhone,
        passwordHash,
        status: 'pending',
      })
      .returning();

    // Generate JWT token
    const token = jwt.sign(
      { id: newDriver.id, email: newDriver.email, role: 'driver', name: newDriver.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      driver: {
        id: newDriver.id,
        name: newDriver.name,
        email: newDriver.email,
        phone: newDriver.phone,
        status: newDriver.status,
      },
    });
  } catch (error) {
    console.error('Driver signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Driver Me
export const driverMe = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, driverId))
      .limit(1);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        status: driver.status,
      },
    });
  } catch (error) {
    console.error('Driver me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Driver Profile - GET (alias for driverMe, but with extra fields for native app)
export const getDriverProfile = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, driverId))
      .limit(1);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        status: driver.status,
        isOnline: true, // Default to true when queried
      },
    });
  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Driver Profile - PUT (update profile/online status)
export const updateDriverProfile = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // For now, just acknowledge the update (isOnline is not in schema yet)
    const { isOnline, name, phone } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const [updatedDriver] = await db
      .update(drivers)
      .set(updateData)
      .where(eq(drivers.id, driverId))
      .returning();

    res.json({
      driver: {
        id: updatedDriver.id,
        name: updatedDriver.name,
        email: updatedDriver.email,
        phone: updatedDriver.phone,
        status: updatedDriver.status,
        isOnline: isOnline !== undefined ? isOnline : true,
      },
    });
  } catch (error) {
    console.error('Update driver profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper to format order for driver app (maps DB fields to what the native app expects)
function formatOrderForDriver(order: any) {
  const pricing = order.pricingJson || {};
  const items = order.itemsJson || {};
  const fullAddress = [order.street, order.city, order.state, order.zip].filter(Boolean).join(', ');

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
    estimated_price: pricing.total || pricing.estimatedPrice || 0,
    final_price: pricing.total || 0,
    volume_tier: pricing.volumeTier || items.volumeTier || null,
    customer_name: order.customerName,
    customer_phone: order.phone,
    customer_email: order.email,
    customer_notes: items.customerNotes || pricing.customerNotes || null,
    items: items.items || items.selectedItems || [],
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    assigned_driver_id: order.assignedDriverId,
  };
}

// Get Available Jobs/Orders (for drivers)
// Includes orders with status 'pending' OR 'paid' (paid = customer paid, waiting for driver)
export const getAvailableJobs = async (req: AuthRequest, res: Response) => {
  try {
    // Get jobs that are pending or paid (not assigned to any driver)
    const availableJobs = await db
      .select()
      .from(orders)
      .where(
        and(
          or(
            eq(orders.status, 'pending'),
            eq(orders.status, 'paid')
          ),
          isNull(orders.assignedDriverId)
        )
      )
      .orderBy(desc(orders.createdAt));

    // Format orders for the driver app
    const formattedOrders = availableJobs.map(formatOrderForDriver);

    // Return both 'jobs' and 'orders' keys for compatibility with both apps
    res.json({ 
      jobs: formattedOrders, 
      orders: formattedOrders 
    });
  } catch (error) {
    console.error('Get available jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get My Jobs (assigned to this driver)
export const getMyJobs = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get jobs assigned to this driver
    const myJobs = await db
      .select()
      .from(orders)
      .where(eq(orders.assignedDriverId, driverId))
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

    if (!driverId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if job exists and is available
    const [job] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if ((job.status !== 'pending' && job.status !== 'paid') || job.assignedDriverId) {
      return res.status(400).json({ error: 'Job is no longer available' });
    }

    // Assign job to driver
    const [updatedJob] = await db
      .update(orders)
      .set({
        assignedDriverId: driverId,
        status: 'assigned',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
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

    if (!driverId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [job] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, id),
          eq(orders.assignedDriverId, driverId)
        )
      )
      .limit(1);

    if (!job) {
      return res.status(404).json({ error: 'Job not found or not assigned to you' });
    }

    if (job.status !== 'assigned') {
      return res.status(400).json({ error: 'Job cannot be started in current status' });
    }

    const [updatedJob] = await db
      .update(orders)
      .set({
        status: 'in_progress',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
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

    if (!driverId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [job] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, id),
          eq(orders.assignedDriverId, driverId)
        )
      )
      .limit(1);

    if (!job) {
      return res.status(404).json({ error: 'Job not found or not assigned to you' });
    }

    if (job.status !== 'in_progress') {
      return res.status(400).json({ error: 'Job must be in progress to complete' });
    }

    const [updatedJob] = await db
      .update(orders)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    res.json({ job: formatOrderForDriver(updatedJob), order: formatOrderForDriver(updatedJob) });
  } catch (error) {
    console.error('Complete job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
