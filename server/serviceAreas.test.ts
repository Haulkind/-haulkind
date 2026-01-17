import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

// Mock context
const createMockContext = (): Context => ({
  req: {} as any,
  res: {} as any,
  user: null,
});

describe("Service Areas API", () => {
  it("should list all service areas", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const areas = await caller.serviceAreas.list();
    
    expect(Array.isArray(areas)).toBe(true);
    expect(areas.length).toBeGreaterThan(0);
    
    // Check first area has required fields
    if (areas.length > 0) {
      expect(areas[0]).toHaveProperty("id");
      expect(areas[0]).toHaveProperty("name");
      expect(areas[0]).toHaveProperty("state");
      expect(areas[0].isActive).toBe(true);
    }
  });

  it("should check coverage for valid coordinates", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Philadelphia coordinates (should be covered)
    const result = await caller.serviceAreas.checkCoverage({
      latitude: 39.9526,
      longitude: -75.1652,
    });

    expect(result).toHaveProperty("covered");
    expect(result).toHaveProperty("serviceArea");
    
    // Philadelphia should be covered based on seed data
    expect(result.covered).toBe(true);
    if (result.serviceArea) {
      // Should be in PA, NY, or NJ
      expect(["PA", "NY", "NJ"]).toContain(result.serviceArea.state);
    }
  });

  it("should return not covered for coordinates outside service areas", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Los Angeles coordinates (should NOT be covered)
    const result = await caller.serviceAreas.checkCoverage({
      latitude: 34.0522,
      longitude: -118.2437,
    });

    expect(result.covered).toBe(false);
    expect(result.serviceArea).toBeNull();
  });
});
