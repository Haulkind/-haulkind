#!/usr/bin/env node
/**
 * Seed Test Data Utility
 * 
 * Creates minimal test data for smoke testing:
 * - 2 approved online drivers (one haul-away, one labor-only)
 * - 1 customer
 * - Service areas (PA, NY, NJ)
 * - Pricing configuration
 * 
 * Usage:
 *   node scripts/seed-test-data.mjs
 *   node scripts/seed-test-data.mjs --clean  # Clean existing data first
 */

import { createConnection } from 'mysql2/promise';
import bcrypt from 'bcrypt';

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/haulkind';

// Parse DATABASE_URL
const dbUrl = new URL(DATABASE_URL.replace('mysql://', 'http://'));
const dbConfig = {
  host: dbUrl.hostname,
  port: dbUrl.port || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
};

console.log('🌱 Haulkind Test Data Seeder\n');
console.log(`📊 Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}\n`);

const shouldClean = process.argv.includes('--clean');

async function main() {
  const connection = await createConnection(dbConfig);
  
  try {
    if (shouldClean) {
      console.log('🧹 Cleaning existing test data...');
      await cleanTestData(connection);
      console.log('✅ Test data cleaned\n');
    }
    
    console.log('🌱 Seeding test data...\n');
    
    // 1. Create service areas
    console.log('1️⃣  Creating service areas...');
    const serviceAreas = await createServiceAreas(connection);
    console.log(`   ✅ Created ${serviceAreas.length} service areas\n`);
    
    // 2. Create pricing
    console.log('2️⃣  Creating pricing configuration...');
    await createPricing(connection, serviceAreas);
    console.log('   ✅ Pricing configured\n');
    
    // 3. Create customer
    console.log('3️⃣  Creating test customer...');
    const customer = await createCustomer(connection);
    console.log(`   ✅ Customer created: ${customer.email}\n`);
    
    // 4. Create drivers
    console.log('4️⃣  Creating test drivers...');
    const drivers = await createDrivers(connection, serviceAreas);
    console.log(`   ✅ Created ${drivers.length} drivers\n`);
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Test Data Seeded Successfully!\n');
    console.log('📋 Summary:');
    console.log(`   • Service Areas: ${serviceAreas.length}`);
    console.log(`   • Customers: 1`);
    console.log(`   • Drivers: ${drivers.length}`);
    console.log('');
    console.log('👤 Test Customer:');
    console.log(`   Email: ${customer.email}`);
    console.log(`   Password: ${customer.password}`);
    console.log('');
    console.log('🚗 Test Drivers:');
    drivers.forEach((driver, i) => {
      console.log(`   ${i + 1}. ${driver.name}`);
      console.log(`      Email: ${driver.email}`);
      console.log(`      Password: ${driver.password}`);
      console.log(`      Services: ${driver.services.join(', ')}`);
      console.log(`      Status: ${driver.status}`);
      console.log('');
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🧪 Ready for smoke testing!');
    console.log('   Run: npm run smoke-test\n');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

async function cleanTestData(connection) {
  // Delete in reverse order of foreign key dependencies
  await connection.query('DELETE FROM payments WHERE 1=1');
  await connection.query('DELETE FROM payouts WHERE 1=1');
  await connection.query('DELETE FROM jobPhotos WHERE 1=1');
  await connection.query('DELETE FROM timeExtensionRequests WHERE 1=1');
  await connection.query('DELETE FROM offers WHERE 1=1');
  await connection.query('DELETE FROM jobs WHERE 1=1');
  await connection.query('DELETE FROM driverLocations WHERE 1=1');
  await connection.query('DELETE FROM drivers WHERE email LIKE \'test-%\'');
  await connection.query('DELETE FROM customers WHERE email LIKE \'test-%\'');
  await connection.query('DELETE FROM users WHERE email LIKE \'test-%\'');
  await connection.query('DELETE FROM laborRates WHERE 1=1');
  await connection.query('DELETE FROM addOns WHERE 1=1');
  await connection.query('DELETE FROM volumePricing WHERE 1=1');
  await connection.query('DELETE FROM serviceAreas WHERE name LIKE \'Test %\'');
}

async function createServiceAreas(connection) {
  const areas = [
    {
      name: 'Test Philadelphia PA',
      state: 'PA',
      city: 'Philadelphia',
      zipCodes: JSON.stringify(['19019', '19102', '19103', '19104']),
      polygon: JSON.stringify([
        { lat: 39.9526, lng: -75.1652 },
        { lat: 40.1376, lng: -75.1652 },
        { lat: 40.1376, lng: -74.9558 },
        { lat: 39.9526, lng: -74.9558 },
      ]),
      isActive: true,
    },
    {
      name: 'Test New York NY',
      state: 'NY',
      city: 'New York',
      zipCodes: JSON.stringify(['10001', '10002', '10003', '10004']),
      polygon: JSON.stringify([
        { lat: 40.7128, lng: -74.0060 },
        { lat: 40.8128, lng: -74.0060 },
        { lat: 40.8128, lng: -73.9060 },
        { lat: 40.7128, lng: -73.9060 },
      ]),
      isActive: true,
    },
    {
      name: 'Test Newark NJ',
      state: 'NJ',
      city: 'Newark',
      zipCodes: JSON.stringify(['07102', '07103', '07104', '07105']),
      polygon: JSON.stringify([
        { lat: 40.7357, lng: -74.1724 },
        { lat: 40.7857, lng: -74.1724 },
        { lat: 40.7857, lng: -74.1224 },
        { lat: 40.7357, lng: -74.1224 },
      ]),
      isActive: true,
    },
  ];
  
  const result = [];
  for (const area of areas) {
    const [rows] = await connection.query(
      'INSERT INTO serviceAreas (name, state, city, zipCodes, polygon, isActive) VALUES (?, ?, ?, ?, ?, ?)',
      [area.name, area.state, area.city, area.zipCodes, area.polygon, area.isActive]
    );
    result.push({ id: rows.insertId, ...area });
  }
  
  return result;
}

async function createPricing(connection, serviceAreas) {
  for (const area of serviceAreas) {
    // Volume pricing
    const volumeTiers = [
      { tier: '1/8 Truck', basePrice: 109, disposalCap: 25 },
      { tier: '1/4 Truck', basePrice: 169, disposalCap: 35 },
      { tier: '1/2 Truck', basePrice: 279, disposalCap: 50 },
      { tier: '3/4 Truck', basePrice: 389, disposalCap: 75 },
      { tier: 'Full Truck', basePrice: 529, disposalCap: 100 },
    ];
    
    for (const volume of volumeTiers) {
      await connection.query(
        'INSERT INTO volumePricing (serviceAreaId, tier, basePrice, disposalCap) VALUES (?, ?, ?, ?)',
        [area.id, volume.tier, volume.basePrice, volume.disposalCap]
      );
    }
    
    // Add-ons
    const addOns = [
      { name: 'Stairs (per flight)', price: 25, isActive: true },
      { name: 'Extra Labor', price: 50, isActive: true },
      { name: 'Heavy Items', price: 35, isActive: true },
      { name: 'Appliance Removal', price: 40, isActive: true },
    ];
    
    for (const addOn of addOns) {
      await connection.query(
        'INSERT INTO addOns (serviceAreaId, name, price, isActive) VALUES (?, ?, ?, ?)',
        [area.id, addOn.name, addOn.price, addOn.isActive]
      );
    }
    
    // Labor rates
    const laborRates = [
      { helpersCount: 1, hourlyRate: 80, minimumHours: 2 },
      { helpersCount: 2, hourlyRate: 120, minimumHours: 2 },
    ];
    
    for (const rate of laborRates) {
      await connection.query(
        'INSERT INTO laborRates (serviceAreaId, helpersCount, hourlyRate, minimumHours) VALUES (?, ?, ?, ?)',
        [area.id, rate.helpersCount, rate.hourlyRate, rate.minimumHours]
      );
    }
  }
}

async function createCustomer(connection) {
  const email = 'test-customer@haulkind.com';
  const password = 'TestPass123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const [userResult] = await connection.query(
    'INSERT INTO users (email, passwordHash, role) VALUES (?, ?, ?)',
    [email, hashedPassword, 'customer']
  );
  
  const userId = userResult.insertId;
  
  // Create customer
  await connection.query(
    'INSERT INTO customers (userId, name, phone) VALUES (?, ?, ?)',
    [userId, 'Test Customer', '+15551234567']
  );
  
  return { email, password };
}

async function createDrivers(connection, serviceAreas) {
  const drivers = [
    {
      name: 'Test Driver - Haul Away',
      email: 'test-driver-haul@haulkind.com',
      password: 'TestPass123!',
      phone: '+15551234568',
      canHaulAway: true,
      canLaborOnly: false,
      serviceAreaId: serviceAreas[0].id, // Philadelphia
      vehicleType: 'pickup_truck',
      vehicleMake: 'Ford',
      vehicleModel: 'F-150',
      vehicleYear: 2020,
      licensePlate: 'TEST123',
      state: 'PA',
    },
    {
      name: 'Test Driver - Labor Only',
      email: 'test-driver-labor@haulkind.com',
      password: 'TestPass123!',
      phone: '+15551234569',
      canHaulAway: false,
      canLaborOnly: true,
      serviceAreaId: serviceAreas[0].id, // Philadelphia
      vehicleType: 'van',
      vehicleMake: 'Toyota',
      vehicleModel: 'Sienna',
      vehicleYear: 2019,
      licensePlate: 'TEST456',
      state: 'PA',
    },
  ];
  
  const result = [];
  
  for (const driver of drivers) {
    const hashedPassword = await bcrypt.hash(driver.password, 10);
    
    // Create user
    const [userResult] = await connection.query(
      'INSERT INTO users (email, passwordHash, role) VALUES (?, ?, ?)',
      [driver.email, hashedPassword, 'driver']
    );
    
    const userId = userResult.insertId;
    
    // Create driver
    await connection.query(
      `INSERT INTO drivers (
        userId, name, phone, serviceAreaId, 
        canHaulAway, canLaborOnly, 
        vehicleType, vehicleMake, vehicleModel, vehicleYear, 
        licensePlate, state,
        status, isOnline, rating, totalJobs, totalCompleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, driver.name, driver.phone, driver.serviceAreaId,
        driver.canHaulAway, driver.canLaborOnly,
        driver.vehicleType, driver.vehicleMake, driver.vehicleModel, driver.vehicleYear,
        driver.licensePlate, driver.state,
        'approved', true, 5.0, 0, 0
      ]
    );
    
    result.push({
      name: driver.name,
      email: driver.email,
      password: driver.password,
      services: [
        driver.canHaulAway && 'Haul Away',
        driver.canLaborOnly && 'Labor Only',
      ].filter(Boolean),
      status: 'approved (online)',
    });
  }
  
  return result;
}

main().catch(console.error);
