import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function runMigrations() {
    const client = await pool.connect();
    try {
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
                                                                                                                                                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                                                                                                                                              );
                                                                                                                                                                                    CREATE TABLE IF NOT EXISTS drivers (
                                                                                                                                                                                            id SERIAL PRIMARY KEY,
                                                                                                                                                                                                    name TEXT NOT NULL,
                                                                                                                                                                                                            phone TEXT NOT NULL,
                                                                                                                                                                                                                    email TEXT NOT NULL,
                                                                                                                                                                                                                            vehicle_type TEXT NOT NULL,
                                                                                                                                                                                                                                    license_plate TEXT NOT NULL,
                                                                                                                                                                                                                                            status TEXT NOT NULL DEFAULT 'available',
                                                                                                                                                                                                                                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                                                                                                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
                                                                                                                                                                                                                                                                              CREATE INDEX IF NOT EXISTS idx_orders_assigned_driver_id ON orders(assigned_driver_id);
                                                                                                                                                                                                                                                                                    CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
                                                                                                                                                                                                                                                                                        `);
          console.log('✅ Migrations completed successfully');
          return { success: true, message: 'Tables created successfully' };
    } catch (error) {
          console.error('❌ Migration failed:', error);
          throw error;
    } finally {
          client.release();
    }
}
