import { Request, Response } from 'express';
import { db } from './db/index.js';
import { drivers, orders, adminAuditLog } from './db/schema.js';
import { eq, desc, or, and } from 'drizzle-orm';

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

// Helper to log admin actions
async function logAdminAction(
  adminUserId: number,
  actionType: string,
  targetDriverId?: number,
  targetOrderId?: number,
  notes?: string
) {
  try {
    await db.insert(adminAuditLog).values({
      adminUserId,
      actionType,
      targetDriverId,
      targetOrderId,
      notes,
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

// GET /admin/drivers - List all drivers with filters
export const listDrivers = async (req: AuthRequest, res: Response) => {
  try {
    const { status, active } = req.query;

    let query = db.select().from(drivers);

    // Apply filters
    const conditions = [];
    if (status) {
      conditions.push(eq(drivers.driverStatus, status as string));
    }
    if (active === 'true') {
      conditions.push(eq(drivers.isActive, 1));
    } else if (active === 'false') {
      conditions.push(eq(drivers.isActive, 0));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const allDrivers = await query.orderBy(desc(drivers.createdAt));

    res.json({ drivers: allDrivers });
  } catch (error) {
    console.error('List drivers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /admin/drivers/:id - Get driver details
export const getDriverDetails = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = parseInt(req.params.id, 10);

    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, driverId))
      .limit(1);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ driver });
  } catch (error) {
    console.error('Get driver details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /admin/drivers/:id/approve - Approve driver
export const approveDriver = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = parseInt(req.params.id, 10);
    const adminId = parseInt(req.user?.id || '0', 10);
    const { notes } = req.body;

    const [updatedDriver] = await db
      .update(drivers)
      .set({
        driverStatus: 'approved',
        isActive: 1,
        adminNotes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updatedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    await logAdminAction(adminId, 'approve_driver', driverId, undefined, notes);

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
    const adminId = parseInt(req.user?.id || '0', 10);
    const { reason, notes } = req.body;

    const [updatedDriver] = await db
      .update(drivers)
      .set({
        driverStatus: 'rejected',
        isActive: 0,
        rejectionReason: reason || 'Not specified',
        adminNotes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updatedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    await logAdminAction(adminId, 'reject_driver', driverId, undefined, `${reason} | ${notes}`);

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
    const adminId = parseInt(req.user?.id || '0', 10);
    const { reason, notes } = req.body;

    const [updatedDriver] = await db
      .update(drivers)
      .set({
        driverStatus: 'suspended',
        isActive: 0,
        adminNotes: notes || reason || 'Suspended by admin',
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updatedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    await logAdminAction(adminId, 'suspend_driver', driverId, undefined, `${reason} | ${notes}`);

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
    const adminId = parseInt(req.user?.id || '0', 10);
    const { requestedFields, notes } = req.body;

    if (!requestedFields || !Array.isArray(requestedFields)) {
      return res.status(400).json({ error: 'requestedFields must be an array' });
    }

    const [updatedDriver] = await db
      .update(drivers)
      .set({
        driverStatus: 'needs_more_info',
        requestedFields: JSON.stringify(requestedFields),
        adminNotes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updatedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    await logAdminAction(adminId, 'request_more_info', driverId, undefined, `Fields: ${requestedFields.join(', ')} | ${notes}`);

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
    const adminId = parseInt(req.user?.id || '0', 10);
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const [updatedDriver] = await db
      .update(drivers)
      .set({
        isActive: isActive ? 1 : 0,
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updatedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    await logAdminAction(adminId, isActive ? 'activate_driver' : 'deactivate_driver', driverId);

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
    const adminId = parseInt(req.user?.id || '0', 10);
    const { driverId, note } = req.body;

    if (!driverId) {
      return res.status(400).json({ error: 'driverId is required' });
    }

    // Check if driver exists and is approved + active
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, driverId))
      .limit(1);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    if (driver.driverStatus !== 'approved' || driver.isActive !== 1) {
      return res.status(400).json({ 
        error: 'Driver must be approved and active to receive orders',
        driverStatus: driver.driverStatus,
        isActive: driver.isActive
      });
    }

    // Assign order to driver
    const [updatedOrder] = await db
      .update(orders)
      .set({
        assignedDriverId: driverId,
        assignedByAdmin: 1,
        assignedAt: new Date(),
        assignmentNote: note || null,
        status: 'assigned',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await logAdminAction(adminId, 'assign_order', driverId, orderId, note);

    res.json({ order: updatedOrder, message: 'Order assigned to driver successfully' });
  } catch (error) {
    console.error('Assign order to driver error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /admin/audit-log - Get admin action history
export const getAuditLog = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 100 } = req.query;

    const logs = await db
      .select()
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(parseInt(limit as string, 10));

    res.json({ logs });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
