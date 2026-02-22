import { Pool } from 'pg';
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
export async function runMigrations() {
    const client = await pool.connect();
    try {
        // Create tables if they don't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                service_type TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT NOT NULL,
                street TEXT NOT NULL,
                city TEXT NOT NULL,
                state TEXT NOT NULL,
                zip TEXT NOT NULL,
                lat DOUBLE PRECISION,
                lng DOUBLE PRECISION,
                pickup_date TEXT NOT NULL,
                pickup_time_window TEXT NOT NULL,
                items_json TEXT NOT NULL,
                pricing_json TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                assigned_driver_id INTEGER,
                customer_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );


            CREATE TABLE IF NOT EXISTS drivers (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT NOT NULL,
                password_hash TEXT,
                vehicle_type TEXT,
                license_plate TEXT,
                status TEXT NOT NULL DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );


            CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
            CREATE INDEX IF NOT EXISTS idx_orders_assigned_driver_id ON orders(assigned_driver_id);
            CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
        `);
        // Add columns that may not exist yet (safe ALTER TABLE)
        const alterQueries = [
            "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS password_hash TEXT",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_notes TEXT",
        ];
        for (const query of alterQueries) {
            try {
                await client.query(query);
            }
            catch (e) {
                // Column may already exist, ignore
                if (!e.message.includes('already exists')) {
                    console.warn(`Warning running: ${query}`, e.message);
                }
            }
        }
        console.log('✅ Migrations completed successfully');
    }
    catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
