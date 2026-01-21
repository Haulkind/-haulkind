import { getDb } from "../server/db";
import { items, promoCodes } from "./schema";

/**
 * Seed Items Catalog (LoadUp-inspired)
 * Hierarchical structure: Main categories → Sub-categories
 */

async function seedItems() {
  console.log("🌱 Seeding items catalog...");

  // Main Categories (parentId = null)
  const categories = [
    {
      name: "Furniture",
      slug: "furniture",
      description: "Couches, tables, chairs, and more",
      basePrice: "0",
      isPopular: true,
      sortOrder: 1,
    },
    {
      name: "Appliances",
      slug: "appliances",
      description: "Refrigerators, washers, dryers, and more",
      basePrice: "0",
      isPopular: true,
      sortOrder: 2,
    },
    {
      name: "Mattresses & Beds",
      slug: "mattresses-beds",
      description: "Mattresses, box springs, bed frames",
      basePrice: "0",
      isPopular: true,
      sortOrder: 3,
    },
    {
      name: "Electronics",
      slug: "electronics",
      description: "TVs, computers, printers, and more",
      basePrice: "0",
      isPopular: false,
      sortOrder: 4,
    },
    {
      name: "Exercise Equipment",
      slug: "exercise-equipment",
      description: "Treadmills, ellipticals, weights",
      basePrice: "0",
      isPopular: false,
      sortOrder: 5,
    },
    {
      name: "Outdoor Items",
      slug: "outdoor-items",
      description: "Patio furniture, grills, lawn equipment",
      basePrice: "0",
      isPopular: false,
      sortOrder: 6,
    },
  ];

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const insertedCategories = await db.insert(items).values(categories);
  console.log(`✅ Inserted ${categories.length} main categories`);

  // Get category IDs (assuming auto-increment starts at 1)
  const furnitureId = 1;
  const appliancesId = 2;
  const mattressesId = 3;
  const electronicsId = 4;
  const exerciseId = 5;
  const outdoorId = 6;

  // Sub-categories: Furniture
  const furnitureItems = [
    {
      name: "Couch / Loveseat",
      slug: "couch-loveseat",
      description: "Standard couch or loveseat",
      parentId: furnitureId,
      basePrice: "89.00",
      isPopular: true,
      sortOrder: 1,
    },
    {
      name: "Sectional Sofa - 2 Pieces",
      slug: "sectional-sofa-2pc",
      description: "2-piece sectional sofa",
      parentId: furnitureId,
      basePrice: "129.00",
      isPopular: true,
      sortOrder: 2,
    },
    {
      name: "Sleeper Sofa",
      slug: "sleeper-sofa",
      description: "Sofa with pull-out bed",
      parentId: furnitureId,
      basePrice: "119.00",
      isPopular: false,
      sortOrder: 3,
    },
    {
      name: "Sectional Sofa - 3 Pieces",
      slug: "sectional-sofa-3pc",
      description: "3-piece sectional sofa",
      parentId: furnitureId,
      basePrice: "169.00",
      isPopular: false,
      sortOrder: 4,
    },
    {
      name: "Reclining Sofa",
      slug: "reclining-sofa",
      description: "Sofa with reclining seats",
      parentId: furnitureId,
      basePrice: "139.00",
      isPopular: false,
      sortOrder: 5,
    },
    {
      name: "Loveseat - Reclining",
      slug: "loveseat-reclining",
      description: "Reclining loveseat",
      parentId: furnitureId,
      basePrice: "109.00",
      isPopular: false,
      sortOrder: 6,
    },
    {
      name: "Futon",
      slug: "futon",
      description: "Convertible futon",
      parentId: furnitureId,
      basePrice: "69.00",
      isPopular: false,
      sortOrder: 7,
    },
    {
      name: "Sectional Sofa - 4 Pieces",
      slug: "sectional-sofa-4pc",
      description: "4-piece sectional sofa",
      parentId: furnitureId,
      basePrice: "209.00",
      isPopular: false,
      sortOrder: 8,
    },
    {
      name: "Sectional Sofa - 5 Pieces",
      slug: "sectional-sofa-5pc",
      description: "5-piece sectional sofa",
      parentId: furnitureId,
      basePrice: "249.00",
      isPopular: false,
      sortOrder: 9,
    },
    {
      name: "Sectional - With Built-In Recliner",
      slug: "sectional-built-in-recliner",
      description: "Sectional with integrated recliner",
      parentId: furnitureId,
      basePrice: "189.00",
      isPopular: false,
      sortOrder: 10,
    },
    {
      name: "Sectional - With Built-In Sleeper",
      slug: "sectional-built-in-sleeper",
      description: "Sectional with integrated sleeper",
      parentId: furnitureId,
      basePrice: "199.00",
      isPopular: false,
      sortOrder: 11,
    },
    {
      name: "Dining Table",
      slug: "dining-table",
      description: "Standard dining table",
      parentId: furnitureId,
      basePrice: "79.00",
      isPopular: true,
      sortOrder: 12,
    },
    {
      name: "Dining Chair (each)",
      slug: "dining-chair",
      description: "Single dining chair",
      parentId: furnitureId,
      basePrice: "19.00",
      isPopular: false,
      sortOrder: 13,
    },
    {
      name: "Coffee Table",
      slug: "coffee-table",
      description: "Living room coffee table",
      parentId: furnitureId,
      basePrice: "39.00",
      isPopular: false,
      sortOrder: 14,
    },
    {
      name: "Dresser",
      slug: "dresser",
      description: "Bedroom dresser",
      parentId: furnitureId,
      basePrice: "69.00",
      isPopular: true,
      sortOrder: 15,
    },
    {
      name: "Desk",
      slug: "desk",
      description: "Office or computer desk",
      parentId: furnitureId,
      basePrice: "59.00",
      isPopular: false,
      sortOrder: 16,
    },
    {
      name: "Bookshelf",
      slug: "bookshelf",
      description: "Standing bookshelf",
      parentId: furnitureId,
      basePrice: "49.00",
      isPopular: false,
      sortOrder: 17,
    },
  ];

  await db.insert(items).values(furnitureItems);
  console.log(`✅ Inserted ${furnitureItems.length} furniture items`);

  // Sub-categories: Appliances
  const applianceItems = [
    {
      name: "Refrigerator",
      slug: "refrigerator",
      description: "Standard refrigerator",
      parentId: appliancesId,
      basePrice: "89.00",
      isPopular: true,
      sortOrder: 1,
    },
    {
      name: "Washer",
      slug: "washer",
      description: "Washing machine",
      parentId: appliancesId,
      basePrice: "79.00",
      isPopular: true,
      sortOrder: 2,
    },
    {
      name: "Dryer",
      slug: "dryer",
      description: "Clothes dryer",
      parentId: appliancesId,
      basePrice: "79.00",
      isPopular: true,
      sortOrder: 3,
    },
    {
      name: "Stove / Oven",
      slug: "stove-oven",
      description: "Kitchen stove or oven",
      parentId: appliancesId,
      basePrice: "89.00",
      isPopular: false,
      sortOrder: 4,
    },
    {
      name: "Dishwasher",
      slug: "dishwasher",
      description: "Built-in or portable dishwasher",
      parentId: appliancesId,
      basePrice: "69.00",
      isPopular: false,
      sortOrder: 5,
    },
    {
      name: "Microwave",
      slug: "microwave",
      description: "Countertop or over-range microwave",
      parentId: appliancesId,
      basePrice: "29.00",
      isPopular: false,
      sortOrder: 6,
    },
    {
      name: "Water Heater",
      slug: "water-heater",
      description: "Hot water heater",
      parentId: appliancesId,
      basePrice: "99.00",
      isPopular: false,
      sortOrder: 7,
    },
  ];

  await db.insert(items).values(applianceItems);
  console.log(`✅ Inserted ${applianceItems.length} appliance items`);

  // Sub-categories: Mattresses & Beds
  const mattressItems = [
    {
      name: "Twin Mattress",
      slug: "twin-mattress",
      description: "Twin size mattress",
      parentId: mattressesId,
      basePrice: "49.00",
      isPopular: true,
      sortOrder: 1,
    },
    {
      name: "Full Mattress",
      slug: "full-mattress",
      description: "Full size mattress",
      parentId: mattressesId,
      basePrice: "59.00",
      isPopular: true,
      sortOrder: 2,
    },
    {
      name: "Queen Mattress",
      slug: "queen-mattress",
      description: "Queen size mattress",
      parentId: mattressesId,
      basePrice: "69.00",
      isPopular: true,
      sortOrder: 3,
    },
    {
      name: "King Mattress",
      slug: "king-mattress",
      description: "King size mattress",
      parentId: mattressesId,
      basePrice: "89.00",
      isPopular: false,
      sortOrder: 4,
    },
    {
      name: "Box Spring",
      slug: "box-spring",
      description: "Mattress box spring",
      parentId: mattressesId,
      basePrice: "49.00",
      isPopular: false,
      sortOrder: 5,
    },
    {
      name: "Bed Frame",
      slug: "bed-frame",
      description: "Metal or wood bed frame",
      parentId: mattressesId,
      basePrice: "59.00",
      isPopular: false,
      sortOrder: 6,
    },
  ];

  await db.insert(items).values(mattressItems);
  console.log(`✅ Inserted ${mattressItems.length} mattress items`);

  // Sub-categories: Electronics
  const electronicItems = [
    {
      name: "TV - Small (under 32\")",
      slug: "tv-small",
      description: "Television under 32 inches",
      parentId: electronicsId,
      basePrice: "39.00",
      isPopular: false,
      sortOrder: 1,
    },
    {
      name: "TV - Medium (32\"-50\")",
      slug: "tv-medium",
      description: "Television 32-50 inches",
      parentId: electronicsId,
      basePrice: "59.00",
      isPopular: true,
      sortOrder: 2,
    },
    {
      name: "TV - Large (50\"+)",
      slug: "tv-large",
      description: "Television over 50 inches",
      parentId: electronicsId,
      basePrice: "79.00",
      isPopular: false,
      sortOrder: 3,
    },
    {
      name: "Computer / Laptop",
      slug: "computer-laptop",
      description: "Desktop computer or laptop",
      parentId: electronicsId,
      basePrice: "29.00",
      isPopular: false,
      sortOrder: 4,
    },
    {
      name: "Printer",
      slug: "printer",
      description: "Home or office printer",
      parentId: electronicsId,
      basePrice: "19.00",
      isPopular: false,
      sortOrder: 5,
    },
  ];

  await db.insert(items).values(electronicItems);
  console.log(`✅ Inserted ${electronicItems.length} electronic items`);

  // Sub-categories: Exercise Equipment
  const exerciseItems = [
    {
      name: "Treadmill",
      slug: "treadmill",
      description: "Exercise treadmill",
      parentId: exerciseId,
      basePrice: "89.00",
      isPopular: true,
      sortOrder: 1,
    },
    {
      name: "Elliptical",
      slug: "elliptical",
      description: "Elliptical machine",
      parentId: exerciseId,
      basePrice: "89.00",
      isPopular: false,
      sortOrder: 2,
    },
    {
      name: "Exercise Bike",
      slug: "exercise-bike",
      description: "Stationary exercise bike",
      parentId: exerciseId,
      basePrice: "69.00",
      isPopular: false,
      sortOrder: 3,
    },
    {
      name: "Weight Bench",
      slug: "weight-bench",
      description: "Weight lifting bench",
      parentId: exerciseId,
      basePrice: "49.00",
      isPopular: false,
      sortOrder: 4,
    },
  ];

  await db.insert(items).values(exerciseItems);
  console.log(`✅ Inserted ${exerciseItems.length} exercise items`);

  // Sub-categories: Outdoor Items
  const outdoorItems = [
    {
      name: "Patio Furniture Set",
      slug: "patio-furniture-set",
      description: "Outdoor patio furniture",
      parentId: outdoorId,
      basePrice: "99.00",
      isPopular: false,
      sortOrder: 1,
    },
    {
      name: "Grill",
      slug: "grill",
      description: "Outdoor grill",
      parentId: outdoorId,
      basePrice: "59.00",
      isPopular: false,
      sortOrder: 2,
    },
    {
      name: "Lawn Mower",
      slug: "lawn-mower",
      description: "Push or riding lawn mower",
      parentId: outdoorId,
      basePrice: "79.00",
      isPopular: false,
      sortOrder: 3,
    },
    {
      name: "Hot Tub",
      slug: "hot-tub",
      description: "Outdoor hot tub",
      parentId: outdoorId,
      basePrice: "299.00",
      isPopular: false,
      sortOrder: 4,
    },
  ];

  await db.insert(items).values(outdoorItems);
  console.log(`✅ Inserted ${outdoorItems.length} outdoor items`);

  console.log("✅ Items catalog seeded successfully!");
}

async function seedPromoCodes() {
  console.log("🌱 Seeding promo codes...");

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const codes = [
    {
      code: "WELCOME10",
      discountType: "percentage" as const,
      discountValue: "10.00",
      minOrderValue: "50.00",
      maxDiscount: "50.00",
      validFrom: new Date("2026-01-01"),
      validUntil: new Date("2026-12-31"),
      maxUses: 1000,
      currentUses: 0,
      isActive: true,
    },
    {
      code: "SPRING25",
      discountType: "fixed" as const,
      discountValue: "25.00",
      minOrderValue: "100.00",
      maxDiscount: null,
      validFrom: new Date("2026-03-01"),
      validUntil: new Date("2026-05-31"),
      maxUses: 500,
      currentUses: 0,
      isActive: true,
    },
    {
      code: "FREESHIP",
      discountType: "fixed" as const,
      discountValue: "15.00",
      minOrderValue: "75.00",
      maxDiscount: null,
      validFrom: new Date("2026-01-01"),
      validUntil: new Date("2026-12-31"),
      maxUses: null, // unlimited
      currentUses: 0,
      isActive: true,
    },
  ];

  await db.insert(promoCodes).values(codes);
  console.log(`✅ Inserted ${codes.length} promo codes`);
}

async function main() {
  try {
    await seedItems();
    await seedPromoCodes();
    console.log("🎉 All seed data inserted successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

main();
