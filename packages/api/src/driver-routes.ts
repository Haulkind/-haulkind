import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./db/index.js";
import { drivers, orders } from "./db/schema.js";
import { eq, and, isNull, or } from "drizzle-orm";

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

// Driver Auth
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
      return res.status(403).json({ error: 'Driver account not approved' });
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
      { expiresIn: '7d' }
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

// Driver Jobs
export const getAvailableJobs = async (req: AuthRequest, res: Response) => {
  try {
    // Get jobs that are pending (not assigned to any driver)
    const availableJobs = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.status, 'pending'),
          isNull(orders.assignedDriverId)
        )
      )
      .orderBy(orders.createdAt);

    res.json({ jobs: availableJobs });
  } catch (error) {
    console.error('Get available jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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
      .orderBy(orders.createdAt);

    res.json({ jobs: myJobs });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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

    if (job.status !== 'pending' || job.assignedDriverId) {
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

    res.json({ job: updatedJob });
  } catch (error) {
    console.error('Accept job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const startJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if job exists and is assigned to this driver
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

    // Update job status to in_progress
    const [updatedJob] = await db
      .update(orders)
      .set({
        status: 'in_progress',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    res.json({ job: updatedJob });
  } catch (error) {
    console.error('Start job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const completeJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if job exists and is assigned to this driver
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

    // Update job status to completed
    const [updatedJob] = await db
      .update(orders)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    res.json({ job: updatedJob });
  } catch (error) {
    console.error('Complete job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
