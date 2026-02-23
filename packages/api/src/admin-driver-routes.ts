import { Request, Response } from 'express';
import { db } from './db/index.js';
import { drivers, orders, usersTable } from './db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; name?: string };
}

// Middleware to require admin role
export const requireAdmin = (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// GET /admin/drivers - List all drivers with user info
export const listDrivers = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const allDrivers = await db
      .select({
        id: drivers.id,
        userId: drivers.userId,
        status: drivers.status,
        isOnline: drivers.isOnline,
        vehicleType: drivers.vehicleType,
        totalCompleted: drivers.totalCompleted,
        averageRating: drivers.averageRating,
        createdAt: drivers.createdAt,
        userName: usersTable.name,
        userEmail: usersTable.email,
        userPhone: usersTable.phone,
      })
      .from(drivers)
      .leftJoin(usersTable, eq(drivers.userId, usersTable.id))
      .orderBy(desc(drivers.createdAt));

    // Filter by status if provided
    const filtered = status
      ? allDrivers.filter(d => d.status === status)
      : allDrivers;

    res.json({ drivers: filtered });
  } catch (error) {
    console.error('List drivers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /admin/drivers/:id - Get driver details
export const getDriverDetails = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = parseInt(req.params.id, 10);

    const [result] = await db
      .select({
        id: drivers.id,
        userId: drivers.userId,
        status: drivers.status,
        isOnline: drivers.isOnline,
        vehicleType: drivers.vehicleType,
        vehicleCapacity: drivers.vehicleCapacity,
        totalCompleted: drivers.totalCompleted,
        totalCancelled: drivers.totalCancelled,
        averageRating: drivers.averageRating,
        createdAt: drivers.createdAt,
        userName: usersTable.name,
        userEmail: usersTable.email,
        userPhone: usersTable.phone,
      })
      .from(drivers)
      .leftJoin(usersTable, eq(drivers.userId, usersTable.id))
      .where(eq(drivers.id, driverId))
      .limit(1);

    if (!result) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ driver: result });
  } catch (error) {
    console.error('Get driver details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /admin/drivers/:id/approve - Approve driver
export const approveDriver = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = parseInt(req.params.id, 10);

    const [updatedDriver] = await db
      .update(drivers)
      .set({
        status: 'approved',
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updatedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ driver: updatedDriver, message: 'Driver approved successfully' });
  } catch (error) {
    console.error('Approve driver error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /admin/drivers/:id/reject - Reject driver
export const rejectDriver = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = parseInt(req.params.id, 10);

    const [updatedDriver] = await db
      .update(drivers)
      .set({
        status: 'blocked',
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updatedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ driver: updatedDriver, message: 'Driver rejected successfully' });
  } catch (error) {
    console.error('Reject driver error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /admin/drivers/:id/suspend - Suspend driver
export const suspendDriver = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = parseInt(req.params.id, 10);

    const [updatedDriver] = await db
      .update(drivers)
      .set({
        status: 'blocked',
        isOnline: false,
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updatedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ driver: updatedDriver, message: 'Driver suspended successfully' });
  } catch (error) {
    console.error('Suspend driver error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /admin/drivers/:id/request-info - Request more info from driver
export const requestMoreInfo = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = parseInt(req.params.id, 10);

    const [updatedDriver] = await db
      .update(drivers)
      .set({
        status: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updatedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ driver: updatedDriver, message: 'More info requested from driver' });
  } catch (error) {
    console.error('Request more info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /admin/drivers/:id/toggle-active - Activate/Deactivate driver
export const toggleDriverActive = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = parseInt(req.params.id, 10);
    const { isActive } = req.body;

    const newStatus = isActive ? 'approved' : 'blocked';

    const [updatedDriver] = await db
      .update(drivers)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updatedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ driver: updatedDriver, message: `Driver ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Toggle driver active error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /admin/orders/:id/assign-driver - Manually assign order to driver
export const assignOrderToDriver = async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { driverId, note } = req.body;

    if (!driverId) {
      return res.status(400).json({ error: 'driverId is required' });
    }

    // Check if driver exists and is approved
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, driverId))
      .limit(1);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    if (driver.status !== 'approved') {
      return res.status(400).json({ error: 'Driver must be approved to receive orders' });
    }

    // Assign order to driver
    const [updatedOrder] = await db
      .update(orders)
      .set({
        assignedDriverId: driverId,
        status: 'assigned',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: updatedOrder, message: 'Order assigned to driver successfully' });
  } catch (error) {
    console.error('Assign order to driver error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /admin/audit-log - placeholder
export const getAuditLog = async (req: AuthRequest, res: Response) => {
  try {
    res.json({ logs: [] });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
