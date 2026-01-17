import { drizzle } from "drizzle-orm/mysql2";
import {
  serviceAreas,
  volumePricing,
  disposalCaps,
  addons,
  distanceRules,
  laborRates,
} from "./schema";

const db = drizzle(process.env.DATABASE_URL!);

async function seed() {
  console.log("🌱 Seeding database...");

  // Service Areas
  const areas = [
    {
      id: "pa-philadelphia",
      name: "Philadelphia",
      state: "PA",
      type: "radius" as const,
      centerLat: "39.9526",
      centerLng: "-75.1652",
      radiusMiles: "60",
      polygonGeoJson: null,
      isActive: true,
    },
    {
      id: "ny-albany",
      name: "Albany",
      state: "NY",
      type: "radius" as const,
      centerLat: "42.6526",
      centerLng: "-73.7562",
      radiusMiles: "30",
      polygonGeoJson: null,
      isActive: true,
    },
    {
      id: "ny-queens",
      name: "Queens",
      state: "NY",
      type: "polygon" as const,
      centerLat: "40.7282",
      centerLng: "-73.7949",
      radiusMiles: null,
      polygonGeoJson: {
        type: "Polygon",
        coordinates: [
          [
            [-73.9626, 40.5431],
            [-73.7004, 40.5431],
            [-73.7004, 40.8007],
            [-73.9626, 40.8007],
            [-73.9626, 40.5431],
          ],
        ],
      },
      isActive: true,
    },
    {
      id: "ny-brooklyn",
      name: "Brooklyn",
      state: "NY",
      type: "polygon" as const,
      centerLat: "40.6782",
      centerLng: "-73.9442",
      radiusMiles: null,
      polygonGeoJson: {
        type: "Polygon",
        coordinates: [
          [
            [-74.0421, 40.5707],
            [-73.8334, 40.5707],
            [-73.8334, 40.7395],
            [-74.0421, 40.7395],
            [-74.0421, 40.5707],
          ],
        ],
      },
      isActive: true,
    },
    {
      id: "nj-north",
      name: "North New Jersey",
      state: "NJ",
      type: "radius" as const,
      centerLat: "40.9176",
      centerLng: "-74.1718",
      radiusMiles: "25",
      polygonGeoJson: null,
      isActive: true,
    },
    {
      id: "nj-central",
      name: "Central New Jersey",
      state: "NJ",
      type: "radius" as const,
      centerLat: "40.2206",
      centerLng: "-74.7597",
      radiusMiles: "20",
      polygonGeoJson: null,
      isActive: true,
    },
    {
      id: "nj-south",
      name: "South New Jersey",
      state: "NJ",
      type: "radius" as const,
      centerLat: "39.7392",
      centerLng: "-75.1198",
      radiusMiles: "25",
      polygonGeoJson: null,
      isActive: true,
    },
  ];

  console.log("📍 Inserting service areas...");
  for (const area of areas) {
    await db.insert(serviceAreas).values(area).onDuplicateKeyUpdate({ set: area });
  }

  // Volume Pricing (same for all areas)
  const volumeTiers = [
    { tier: "1_8" as const, price: "109" },
    { tier: "1_4" as const, price: "169" },
    { tier: "1_2" as const, price: "279" },
    { tier: "3_4" as const, price: "389" },
    { tier: "full" as const, price: "529" },
  ];

  console.log("💰 Inserting volume pricing...");
  for (const area of areas) {
    for (const { tier, price } of volumeTiers) {
      await db
        .insert(volumePricing)
        .values({
          serviceAreaId: area.id,
          volumeTier: tier,
          basePrice: price,
        })
        .onDuplicateKeyUpdate({ set: { basePrice: price } });
    }
  }

  // Disposal Caps
  const disposalTiers = [
    { tier: "1_8" as const, cap: "25" },
    { tier: "1_4" as const, cap: "40" },
    { tier: "1_2" as const, cap: "60" },
    { tier: "3_4" as const, cap: "75" },
    { tier: "full" as const, cap: "95" },
  ];

  console.log("🗑️  Inserting disposal caps...");
  for (const area of areas) {
    for (const { tier, cap } of disposalTiers) {
      await db
        .insert(disposalCaps)
        .values({
          serviceAreaId: area.id,
          volumeTier: tier,
          capAmount: cap,
        })
        .onDuplicateKeyUpdate({ set: { capAmount: cap } });
    }
  }

  // Addons
  const addonTypes = [
    { type: "stairs_1" as const, price: "25" },
    { type: "stairs_2plus" as const, price: "45" },
    { type: "long_carry" as const, price: "35" },
    { type: "heavy" as const, price: "35" },
    { type: "mattress" as const, price: "30" },
    { type: "appliances" as const, price: "40" },
    { type: "same_day" as const, price: "65" },
  ];

  console.log("➕ Inserting addons...");
  for (const area of areas) {
    for (const { type, price } of addonTypes) {
      await db
        .insert(addons)
        .values({
          serviceAreaId: area.id,
          addonType: type,
          price,
        })
        .onDuplicateKeyUpdate({ set: { price } });
    }
  }

  // Distance Rules
  const distanceBands = [
    { min: "0", max: "10", surcharge: "0" },
    { min: "10", max: "20", surcharge: "15" },
    { min: "20", max: "30", surcharge: "30" },
    { min: "30", max: null, surcharge: "45" },
  ];

  console.log("📏 Inserting distance rules...");
  for (const area of areas) {
    for (const { min, max, surcharge } of distanceBands) {
      await db.insert(distanceRules).values({
        serviceAreaId: area.id,
        minMiles: min,
        maxMiles: max,
        surcharge,
      });
    }
  }

  // Labor Rates
  const laborHelpers = [
    { helpers: 1, rate: "79" },
    { helpers: 2, rate: "129" },
  ];

  console.log("👷 Inserting labor rates...");
  for (const area of areas) {
    for (const { helpers, rate } of laborHelpers) {
      await db
        .insert(laborRates)
        .values({
          serviceAreaId: area.id,
          helpersCount: helpers,
          hourlyRate: rate,
          minimumHours: 2,
        })
        .onDuplicateKeyUpdate({ set: { hourlyRate: rate } });
    }
  }

  console.log("✅ Seed completed successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
