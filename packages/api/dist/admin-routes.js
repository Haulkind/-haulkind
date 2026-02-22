import { db } from "./db/index.js";
import { sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
// Middleware to verify admin role
export const requireAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};
// =====================================================
// ADMIN AUTH ROUTES
// =====================================================
// POST /admin/auth/login
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }
        // Find admin user
        const userResult = await db.execute(sql `
      SELECT id, email, password_hash, full_name, role
      FROM users
      WHERE email = ${email} AND role = 'admin'
      LIMIT 1
    `);
        if (!userResult.rows || userResult.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const user = userResult.rows[0];
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // Generate token
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.full_name }, JWT_SECRET, { expiresIn: "7d" });
        res.json({
            token,
            admin: {
                id: user.id,
                email: user.email,
                name: user.full_name,
                role: user.role,
            },
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[ADMIN_LOGIN] Error:", errorMessage);
        res.status(500).json({ error: "Login failed", details: errorMessage });
    }
};
// GET /admin/auth/me
export const adminMe = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const userResult = await db.execute(sql `
      SELECT id, email, full_name, role
      FROM users
      WHERE id = ${userId} AND role = 'admin'
      LIMIT 1
    `);
        if (!userResult.rows || userResult.rows.length === 0) {
            return res.status(404).json({ error: "Admin not found" });
        }
        const user = userResult.rows[0];
        res.json({
            admin: {
                id: user.id,
                email: user.email,
                name: user.full_name,
                role: user.role,
            },
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[ADMIN_ME] Error:", errorMessage);
        res.status(500).json({ error: "Failed to get profile", details: errorMessage });
    }
};
// =====================================================
// ADMIN STATS ROUTES
// =====================================================
// GET /admin/stats/overview
export const getStatsOverview = async (req, res) => {
    try {
        // Get driver stats
        const driverStatsResult = await db.execute(sql `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked
      FROM drivers
    `);
        const driverStats = driverStatsResult.rows[0];
        // Get customer stats
        const customerStatsResult = await db.execute(sql `
      SELECT COUNT(*) as total FROM customers
    `);
        const customerStats = customerStatsResult.rows[0];
        // Get order stats
        const orderStatsResult = await db.execute(sql `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as this_month,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned_orders,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM orders
    `);
        const orderStats = orderStatsResult.rows[0];
        res.json({
            drivers: {
                total: parseInt(driverStats.total),
                pending: parseInt(driverStats.pending),
                approved: parseInt(driverStats.approved),
                blocked: parseInt(driverStats.blocked),
            },
            customers: {
                total: parseInt(customerStats.total),
            },
            orders: {
                total: parseInt(orderStats.total),
                today: parseInt(orderStats.today),
                thisWeek: parseInt(orderStats.this_week),
                thisMonth: parseInt(orderStats.this_month),
                byStatus: {
                    pending: parseInt(orderStats.pending_orders),
                    assigned: parseInt(orderStats.assigned_orders),
                    in_progress: parseInt(orderStats.in_progress_orders),
                    completed: parseInt(orderStats.completed_orders),
                    cancelled: parseInt(orderStats.cancelled_orders),
                },
            },
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[ADMIN_STATS] Error:", errorMessage);
        res.status(500).json({ error: "Failed to get stats", details: errorMessage });
    }
};
// =====================================================
// ADMIN DRIVERS ROUTES
// =====================================================
// GET /admin/drivers
export const getDrivers = async (req, res) => {
    try {
        const { status, search, limit = "50", offset = "0" } = req.query;
        let query = sql `SELECT * FROM drivers WHERE 1=1`;
        if (status) {
            query = sql `${query} AND status = ${status}`;
        }
        if (search) {
            query = sql `${query} AND (name ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'} OR phone ILIKE ${'%' + search + '%'})`;
        }
        query = sql `${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        const driversResult = await db.execute(query);
        // Get total count
        let countQuery = sql `SELECT COUNT(*) as total FROM drivers WHERE 1=1`;
        if (status) {
            countQuery = sql `${countQuery} AND status = ${status}`;
        }
        if (search) {
            countQuery = sql `${countQuery} AND (name ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'} OR phone ILIKE ${'%' + search + '%'})`;
        }
        const countResult = await db.execute(countQuery);
        const total = countResult.rows[0].total;
        res.json({
            drivers: driversResult.rows,
            total: parseInt(total),
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[ADMIN_DRIVERS] Error:", errorMessage);
        res.status(500).json({ error: "Failed to get drivers", details: errorMessage });
    }
};
// GET /admin/drivers/:id
export const getDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const driverResult = await db.execute(sql `
      SELECT * FROM drivers WHERE id = ${id} LIMIT 1
    `);
        if (!driverResult.rows || driverResult.rows.length === 0) {
            return res.status(404).json({ error: "Driver not found" });
        }
        res.json({
            driver: driverResult.rows[0],
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[ADMIN_DRIVER] Error:", errorMessage);
        res.status(500).json({ error: "Failed to get driver", details: errorMessage });
    }
};
// PUT /admin/drivers/:id/status
export const updateDriverStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!["pending", "approved", "blocked"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }
        const result = await db.execute(sql `
      UPDATE drivers 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `);
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ error: "Driver not found" });
        }
        res.json({
            driver: result.rows[0],
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[ADMIN_UPDATE_DRIVER] Error:", errorMessage);
        res.status(500).json({ error: "Failed to update driver", details: errorMessage });
    }
};
// =====================================================
// ADMIN CUSTOMERS ROUTES
// =====================================================
// GET /admin/customers
export const getCustomers = async (req, res) => {
    try {
        const { search, limit = "50", offset = "0" } = req.query;
        let query = sql `
      SELECT 
        c.id,
        c.user_id,
        u.full_name as name,
        u.email,
        u.phone,
        COUNT(o.id) as total_orders,
        c.created_at,
        c.updated_at
      FROM customers c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN orders o ON o.customer_name = u.full_name
      WHERE 1=1
    `;
        if (search) {
            query = sql `${query} AND (u.full_name ILIKE ${'%' + search + '%'} OR u.email ILIKE ${'%' + search + '%'} OR u.phone ILIKE ${'%' + search + '%'})`;
        }
        query = sql `${query} GROUP BY c.id, c.user_id, u.full_name, u.email, u.phone, c.created_at, c.updated_at ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        const customersResult = await db.execute(query);
        // Get total count
        let countQuery = sql `SELECT COUNT(*) as total FROM customers c LEFT JOIN users u ON c.user_id = u.id WHERE 1=1`;
        if (search) {
            countQuery = sql `${countQuery} AND (u.full_name ILIKE ${'%' + search + '%'} OR u.email ILIKE ${'%' + search + '%'} OR u.phone ILIKE ${'%' + search + '%'})`;
        }
        const countResult = await db.execute(countQuery);
        const total = countResult.rows[0].total;
        res.json({
            customers: customersResult.rows,
            total: parseInt(total),
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[ADMIN_CUSTOMERS] Error:", errorMessage);
        res.status(500).json({ error: "Failed to get customers", details: errorMessage });
    }
};
// GET /admin/customers/:id
export const getCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const customerResult = await db.execute(sql `
      SELECT 
        c.id,
        c.user_id,
        u.full_name as name,
        u.email,
        u.phone,
        COUNT(o.id) as total_orders,
        c.created_at,
        c.updated_at
      FROM customers c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN orders o ON o.customer_name = u.full_name
      WHERE c.id = ${id}
      GROUP BY c.id, c.user_id, u.full_name, u.email, u.phone, c.created_at, c.updated_at
      LIMIT 1
    `);
        if (!customerResult.rows || customerResult.rows.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }
        res.json({
            customer: customerResult.rows[0],
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[ADMIN_CUSTOMER] Error:", errorMessage);
        res.status(500).json({ error: "Failed to get customer", details: errorMessage });
    }
};
// =====================================================
// ADMIN ORDERS ROUTES
// =====================================================
// GET /admin/orders
export const getOrders = async (req, res) => {
    try {
        const { status, service_type, search, limit = "50", offset = "0" } = req.query;
        let query = sql `SELECT * FROM orders WHERE 1=1`;
        if (status) {
            query = sql `${query} AND status = ${status}`;
        }
        if (service_type) {
            query = sql `${query} AND service_type = ${service_type}`;
        }
        if (search) {
            query = sql `${query} AND (customer_name ILIKE ${'%' + search + '%'} OR phone ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'})`;
        }
        query = sql `${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        const ordersResult = await db.execute(query);
        // Get total count
        let countQuery = sql `SELECT COUNT(*) as total FROM orders WHERE 1=1`;
        if (status) {
            countQuery = sql `${countQuery} AND status = ${status}`;
        }
        if (service_type) {
            countQuery = sql `${countQuery} AND service_type = ${service_type}`;
        }
        if (search) {
            countQuery = sql `${countQuery} AND (customer_name ILIKE ${'%' + search + '%'} OR phone ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'})`;
        }
        const countResult = await db.execute(countQuery);
        const total = countResult.rows[0].total;
        res.json({
            orders: ordersResult.rows,
            total: parseInt(total),
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[ADMIN_ORDERS] Error:", errorMessage);
        res.status(500).json({ error: "Failed to get orders", details: errorMessage });
    }
};
// GET /admin/orders/:id
export const getOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const orderResult = await db.execute(sql `
      SELECT * FROM orders WHERE id = ${id} LIMIT 1
    `);
        if (!orderResult.rows || orderResult.rows.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.json({
            order: orderResult.rows[0],
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[ADMIN_ORDER] Error:", errorMessage);
        res.status(500).json({ error: "Failed to get order", details: errorMessage });
    }
};
// PUT /admin/orders/:id/assign
export const assignOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { driver_id } = req.body;
        if (!driver_id) {
            return res.status(400).json({ error: "Driver ID required" });
        }
        // Verify driver exists
        const driverResult = await db.execute(sql `
      SELECT id FROM drivers WHERE id = ${driver_id} LIMIT 1
    `);
        if (!driverResult.rows || driverResult.rows.length === 0) {
            return res.status(404).json({ error: "Driver not found" });
        }
        // Update order
        const result = await db.execute(sql `
      UPDATE orders 
      SET assigned_driver_id = ${driver_id}, status = 'assigned', updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `);
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.json({
            order: result.rows[0],
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[ADMIN_ASSIGN_ORDER] Error:", errorMessage);
        res.status(500).json({ error: "Failed to assign order", details: errorMessage });
    }
};
