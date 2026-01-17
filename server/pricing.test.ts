import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

// Mock context
const createMockContext = (): Context => ({
  req: {} as any,
  res: {} as any,
  user: null,
});

let testServiceAreaId: string;

describe("Pricing API", () => {
  beforeAll(async () => {
    // Get a service area ID for testing
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const areas = await caller.serviceAreas.list();
    
    if (areas.length === 0) {
      throw new Error("No service areas found for testing");
    }
    
    testServiceAreaId = areas[0].id;
  });

  it("should calculate haul away quote", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const quote = await caller.pricing.calculateHaulAway({
      serviceAreaId: testServiceAreaId,
      volumeCubicYards: 6, // 1/4 truck
      distanceMiles: 5,
      addonIds: [],
    });

    expect(quote).toHaveProperty("serviceType", "HAUL_AWAY");
    expect(quote).toHaveProperty("volumeTier");
    expect(quote).toHaveProperty("volumeTierLabel");
    expect(quote).toHaveProperty("lineItems");
    expect(quote).toHaveProperty("subtotal");
    expect(quote).toHaveProperty("platformFee");
    expect(quote).toHaveProperty("total");
    expect(quote).toHaveProperty("disposalCapAmount");
    expect(quote).toHaveProperty("disposalCapMessage");

    // Verify calculations
    expect(quote.total).toBeGreaterThan(0);
    expect(quote.platformFee).toBe(quote.subtotal * 0.05);
    expect(quote.total).toBe(quote.subtotal + quote.platformFee);
    
    // Verify line items
    expect(Array.isArray(quote.lineItems)).toBe(true);
    expect(quote.lineItems.length).toBeGreaterThan(0);
    
    // Should have at least volume and platform fee
    const hasVolumeItem = quote.lineItems.some((item: any) => 
      item.description.includes("Haul Away")
    );
    const hasPlatformFee = quote.lineItems.some((item: any) => 
      item.description.includes("Platform Fee")
    );
    
    expect(hasVolumeItem).toBe(true);
    expect(hasPlatformFee).toBe(true);
  });

  it("should calculate labor only quote", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const quote = await caller.pricing.calculateLaborOnly({
      serviceAreaId: testServiceAreaId,
      hours: 3,
      distanceMiles: 5,
    });

    expect(quote).toHaveProperty("serviceType", "LABOR_ONLY");
    expect(quote).toHaveProperty("hours", 3);
    expect(quote).toHaveProperty("hourlyRate");
    expect(quote).toHaveProperty("lineItems");
    expect(quote).toHaveProperty("subtotal");
    expect(quote).toHaveProperty("platformFee");
    expect(quote).toHaveProperty("total");
    expect(quote).toHaveProperty("minimumHours", 2);

    // Verify calculations
    expect(quote.total).toBeGreaterThan(0);
    expect(quote.platformFee).toBe(quote.subtotal * 0.05);
    expect(quote.total).toBe(quote.subtotal + quote.platformFee);
    
    // Verify line items
    expect(Array.isArray(quote.lineItems)).toBe(true);
    
    // Should have labor and platform fee
    const hasLaborItem = quote.lineItems.some((item: any) => 
      item.description.includes("Labor")
    );
    const hasPlatformFee = quote.lineItems.some((item: any) => 
      item.description.includes("Platform Fee")
    );
    
    expect(hasLaborItem).toBe(true);
    expect(hasPlatformFee).toBe(true);
  });

  it("should enforce 2-hour minimum for labor only", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.pricing.calculateLaborOnly({
        serviceAreaId: testServiceAreaId,
        hours: 1, // Below minimum
        distanceMiles: 5,
      })
    ).rejects.toThrow();
  });

  it("should get available addons for service area", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const addons = await caller.pricing.getAddons({
      serviceAreaId: testServiceAreaId,
    });

    expect(Array.isArray(addons)).toBe(true);
    
    // If addons exist, verify structure
    if (addons.length > 0) {
      expect(addons[0]).toHaveProperty("id");
      expect(addons[0]).toHaveProperty("type");
      expect(addons[0]).toHaveProperty("name");
      expect(addons[0]).toHaveProperty("description");
      expect(addons[0]).toHaveProperty("price");
      expect(typeof addons[0].price).toBe("number");
    }
  });
});
