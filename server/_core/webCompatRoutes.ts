/**
 * Web Compatibility Routes
 * 
 * These REST endpoints provide backward compatibility for the web app's
 * Next.js API proxy routes that previously pointed to packages/api (PostgreSQL).
 * They map to the existing MySQL-backed logic in server/.
 * 
 * Endpoints:
 *   POST /quotes              → pricing calculation
 *   POST /jobs                → job/order creation
 *   GET  /jobs/:id            → job status lookup
 *   POST /jobs/:id/pay        → payment processing + dispatch
 *   GET  /service-areas/lookup → service area coverage check
 */

import { Express, Request, Response } from "express";
import {
  getDb,
  findServiceAreaByCoordinates,
  getAllServiceAreas,
  getServiceAreaById,
  getVolumePricing,
  getDisposalCaps,
  getAddons,
  getDistanceRules,
  createJob,
  getJobById,
  updateJob,
  createPayment,
  createHaulAwayDetails,
  getAllDrivers,
  createJobOffer,
} from "../db";

// Volume tier mappings (same as routers/pricing.ts)
const VOLUME_TIERS: Record<string, { min: number; max: number; label: string }> = {
  "1_8": { min: 0, max: 3, label: "1/8 truck" },
  "1_4": { min: 3, max: 6, label: "1/4 truck" },
  "1_2": { min: 6, max: 12, label: "1/2 truck" },
  "3_4": { min: 12, max: 18, label: "3/4 truck" },
  full: { min: 18, max: 24, label: "Full truck" },
};

// Mapping from packages/api volume tier names to server/ volume tier names
const VOLUME_TIER_MAP: Record<string, string> = {
  EIGHTH: "1_8",
  QUARTER: "1_4",
  HALF: "1_2",
  THREE_QUARTER: "3_4",
  FULL: "full",
  // Also accept server/-native tier names
  "1_8": "1_8",
  "1_4": "1_4",
  "1_2": "1_2",
  "3_4": "3_4",
  full: "full",
};

// Addon type mapping from packages/api names to server/ names
const ADDON_TYPE_MAP: Record<string, string> = {
  SAME_DAY: "same_day",
  HEAVY_ITEM: "heavy",
  STAIRS: "stairs_1",
  DISASSEMBLY: "appliances",
};

export function registerWebCompatRoutes(app: Express) {
  // ================================================================
  // POST /quotes — Calculate a price quote
  // ================================================================
  app.post("/quotes", async (req: Request, res: Response) => {
    try {
      const { serviceType, serviceAreaId, volumeTier, volumeCubicYards, addons: addonList, distanceMiles } = req.body;

      // Find the first active service area if none provided
      let areaId = serviceAreaId;
      if (!areaId) {
        const areas = await getAllServiceAreas();
        if (areas.length > 0) {
          areaId = areas[0].id;
        }
      }

      // Map volume tier from packages/api format to server/ format
      const mappedTier = volumeTier ? (VOLUME_TIER_MAP[volumeTier] || volumeTier) : "1_4";
      const tierInfo = VOLUME_TIERS[mappedTier];

      if (!tierInfo) {
        return res.status(400).json({ error: "Invalid volume tier", success: false });
      }

      // Try to get DB-driven pricing if service area exists
      let volumePrice = 0;
      let disposalCapAmount = 0;
      let distanceFee = 0;
      let addonsTotal = 0;
      const breakdown: Array<{ label: string; amount: number }> = [];

      if (areaId) {
        const volumePrices = await getVolumePricing(areaId);
        const disposalCaps = await getDisposalCaps(areaId);
        const distanceRules = await getDistanceRules(areaId);
        const availableAddons = await getAddons(areaId);

        // Volume price
        const volumePriceData = volumePrices.find((vp) => vp.volumeTier === mappedTier);
        volumePrice = volumePriceData ? parseFloat(volumePriceData.basePrice) : 0;

        // Disposal cap
        const disposalCapData = disposalCaps.find((dc) => dc.volumeTier === mappedTier);
        disposalCapAmount = disposalCapData ? parseFloat(disposalCapData.capAmount) : 0;

        // Distance surcharge
        if (distanceMiles) {
          const sortedRules = distanceRules.sort(
            (a, b) => parseFloat(a.minMiles) - parseFloat(b.minMiles)
          );
          for (const rule of sortedRules) {
            const minMiles = parseFloat(rule.minMiles);
            const maxMiles = rule.maxMiles ? parseFloat(rule.maxMiles) : Infinity;
            if (distanceMiles >= minMiles && distanceMiles <= maxMiles) {
              distanceFee = parseFloat(rule.surcharge);
              break;
            }
          }
        }

        // Addons
        if (addonList && Array.isArray(addonList)) {
          for (const addonName of addonList) {
            const mappedType = ADDON_TYPE_MAP[addonName] || addonName;
            const addon = availableAddons.find((a) => a.addonType === mappedType);
            if (addon) {
              const price = parseFloat(addon.price);
              addonsTotal += price;
              breakdown.push({ label: addonName, amount: price });
            }
          }
        }
      }

      // Fallback pricing if no DB pricing found
      if (volumePrice === 0) {
        const fallbackPrices: Record<string, number> = {
          "1_8": 109,
          "1_4": 169,
          "1_2": 279,
          "3_4": 389,
          full: 529,
        };
        volumePrice = fallbackPrices[mappedTier] || 169;

        // Fallback addon pricing
        if (addonList && Array.isArray(addonList)) {
          const fallbackAddonPrices: Record<string, number> = {
            SAME_DAY: 50,
            HEAVY_ITEM: 25,
            STAIRS: 20,
            DISASSEMBLY: 30,
          };
          for (const addonName of addonList) {
            const price = fallbackAddonPrices[addonName] || 0;
            if (price > 0) {
              addonsTotal += price;
              breakdown.push({ label: addonName, amount: price });
            }
          }
        }

        disposalCapAmount = 50;
      }

      breakdown.unshift({ label: `${tierInfo.label} Load`, amount: volumePrice });
      if (distanceFee > 0) {
        breakdown.push({ label: "Distance Surcharge", amount: distanceFee });
      }

      const subtotal = volumePrice + distanceFee + addonsTotal;
      const platformFee = Math.round(subtotal * 0.05 * 100) / 100;
      const total = subtotal + platformFee;

      console.log(`[WebCompat] POST /quotes - tier=${mappedTier} total=$${total}`);

      res.json({
        success: true,
        total,
        subtotal,
        platformFee,
        servicePrice: volumePrice,
        addonPrice: addonsTotal,
        distancePrice: distanceFee,
        disposalIncluded: disposalCapAmount,
        breakdown,
        serviceType: serviceType || "HAUL_AWAY",
        volumeTier: volumeTier || mappedTier,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[WebCompat] POST /quotes error:", msg);
      res.status(500).json({ error: "Failed to calculate quote", details: msg, success: false });
    }
  });

  // ================================================================
  // POST /jobs — Create a new job/order
  // ================================================================
  app.post("/jobs", async (req: Request, res: Response) => {
    try {
      const {
        serviceType,
        serviceAreaId,
        pickupLat,
        pickupLng,
        pickupAddress,
        scheduledFor,
        volumeTier,
        addons: addonList,
        customerName,
        customerPhone,
        customerEmail,
        customerNotes,
        photoUrls,
        // pricing fields from quote
        total: quotedTotal,
        subtotal: quotedSubtotal,
        platformFee: quotedPlatformFee,
      } = req.body;

      if (!pickupAddress) {
        return res.status(400).json({ error: "pickupAddress is required", success: false });
      }

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available", success: false });
      }

      // Find or default service area
      let areaId = serviceAreaId;
      if (!areaId) {
        const areas = await getAllServiceAreas();
        if (areas.length > 0) {
          areaId = areas[0].id;
        } else {
          return res.status(400).json({ error: "No service areas configured", success: false });
        }
      }

      // Map volume tier
      const mappedTier = volumeTier ? (VOLUME_TIER_MAP[volumeTier] || volumeTier) : "1_4";

      // Calculate pricing if not provided
      let totalAmount = quotedTotal || 0;
      let subtotal = quotedSubtotal || 0;
      let platformFee = quotedPlatformFee || 0;

      if (!totalAmount) {
        const fallbackPrices: Record<string, number> = {
          "1_8": 109, "1_4": 169, "1_2": 279, "3_4": 389, full: 529,
        };
        const basePrice = fallbackPrices[mappedTier] || 169;

        let addonTotal = 0;
        if (addonList && Array.isArray(addonList)) {
          const addonPrices: Record<string, number> = {
            SAME_DAY: 50, HEAVY_ITEM: 25, STAIRS: 20, DISASSEMBLY: 30,
          };
          for (const a of addonList) {
            addonTotal += addonPrices[a] || 0;
          }
        }

        subtotal = basePrice + addonTotal;
        platformFee = Math.round(subtotal * 0.05 * 100) / 100;
        totalAmount = subtotal + platformFee;
      }

      // We need a customer record. Use a default guest customer.
      // Look up or create a guest customer for web orders
      const { sql } = await import("drizzle-orm");
      
      // Find or create a guest user for web orders
      let guestUserId: number;
      const existingGuest = await db.execute(
        sql`SELECT id FROM users WHERE email = 'web-guest@haulkind.com' LIMIT 1`
      );
      const guestRows = (existingGuest as any)[0] || [];

      if (guestRows.length > 0) {
        guestUserId = guestRows[0].id;
      } else {
        // Create guest user
        const insertResult = await db.execute(
          sql`INSERT INTO users (email, password_hash, role, full_name, phone, created_at, updated_at)
              VALUES ('web-guest@haulkind.com', 'no-login', 'customer', ${customerName || 'Web Customer'}, ${customerPhone || ''}, NOW(), NOW())`
        );
        guestUserId = (insertResult as any)[0]?.insertId;
      }

      // Find or create customer record
      let customerId: number;
      const existingCustomer = await db.execute(
        sql`SELECT id FROM customers WHERE userId = ${guestUserId} LIMIT 1`
      );
      const customerRows = (existingCustomer as any)[0] || [];

      if (customerRows.length > 0) {
        customerId = customerRows[0].id;
      } else {
        const insertCustomer = await db.execute(
          sql`INSERT INTO customers (userId, created_at, updated_at) VALUES (${guestUserId}, NOW(), NOW())`
        );
        customerId = (insertCustomer as any)[0]?.insertId;
      }

      // Create job using existing createJob function
      const job = await createJob({
        customerId,
        serviceAreaId: areaId,
        serviceType: (serviceType === "LABOR_ONLY" ? "LABOR_ONLY" : "HAUL_AWAY") as "HAUL_AWAY" | "LABOR_ONLY",
        status: "draft",
        pickupAddress,
        pickupLat: String(pickupLat || "0"),
        pickupLon: String(pickupLng || "0"),
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        specialInstructions: customerNotes || null,
        subtotal: String(subtotal),
        platformFee: String(platformFee),
        totalAmount: String(totalAmount),
      });

      if (!job) {
        return res.status(500).json({ error: "Failed to create job", success: false });
      }

      // Create haul away details if applicable
      if (serviceType !== "LABOR_ONLY" && mappedTier) {
        try {
          await createHaulAwayDetails({
            jobId: job.id,
            volumeCubicYards: "0",
            volumeTier: mappedTier as "1_8" | "1_4" | "1_2" | "3_4" | "full",
            disposalCostActual: "0",
          });
        } catch (detailsError) {
          console.warn("[WebCompat] Could not create haul away details:", detailsError);
        }
      }

      console.log(`[WebCompat] POST /jobs - created ${job.id} total=$${totalAmount}`);

      res.status(201).json({
        success: true,
        id: job.id,
        status: job.status,
        total: totalAmount,
        order: job,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[WebCompat] POST /jobs error:", msg);
      res.status(500).json({ error: "Failed to create job", details: msg, success: false });
    }
  });

  // ================================================================
  // GET /jobs/:id — Get job status
  // ================================================================
  app.get("/jobs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const job = await getJobById(id);

      if (!job) {
        return res.status(404).json({ error: "Job not found", success: false });
      }

      console.log(`[WebCompat] GET /jobs/${id} - status=${job.status}`);

      res.json({
        success: true,
        status: job.status,
        order: job,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[WebCompat] GET /jobs/:id error:", msg);
      res.status(500).json({ error: "Failed to get job", details: msg, success: false });
    }
  });

  // ================================================================
  // POST /jobs/:id/pay — Process payment for a job
  // ================================================================
  app.post("/jobs/:id/pay", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { paymentMethodId } = req.body;

      const job = await getJobById(id);
      if (!job) {
        return res.status(404).json({ error: "Job not found", success: false });
      }

      if (job.status !== "draft" && job.status !== "quoted") {
        return res.status(400).json({ 
          error: "Job has already been paid or is in progress",
          success: false,
        });
      }

      // Create payment record
      const payment = await createPayment({
        jobId: job.id,
        customerId: job.customerId,
        amount: job.total || "0",
        provider: paymentMethodId || "web_checkout",
        providerRef: undefined,
        status: "succeeded",
      });

      // Update job status to dispatching
      await updateJob(job.id, { status: "dispatching", paidAt: new Date() });

      // Trigger dispatch — find online approved drivers and create offers
      try {
        const drivers = await getAllDrivers({ status: "approved", isOnline: true });
        if (drivers.length > 0) {
          const wave1Drivers = drivers.slice(0, 3);
          const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
          for (const driver of wave1Drivers) {
            await createJobOffer({
              jobId: job.id,
              driverId: driver.id,
              wave: 1,
              expiresAt,
            });
          }
          console.log(`[WebCompat] Dispatch: ${wave1Drivers.length} offers for job ${job.id}`);
        } else {
          await updateJob(job.id, { status: "no_coverage" });
          console.log(`[WebCompat] Dispatch: no drivers available for job ${job.id}`);
        }
      } catch (dispatchError) {
        console.error("[WebCompat] Dispatch error:", dispatchError);
      }

      const updatedJob = await getJobById(job.id);

      console.log(`[WebCompat] POST /jobs/${id}/pay - payment processed`);

      res.json({
        success: true,
        message: "Payment processed successfully",
        payment,
        job: updatedJob,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[WebCompat] POST /jobs/:id/pay error:", msg);
      res.status(500).json({ error: "Failed to process payment", details: msg, success: false });
    }
  });

  // ================================================================
  // GET /service-areas/lookup — Check if coordinates are covered
  // ================================================================
  app.get("/service-areas/lookup", async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: "Invalid lat/lng parameters", covered: false });
      }

      const area = await findServiceAreaByCoordinates(lat, lng);

      if (area) {
        console.log(`[WebCompat] GET /service-areas/lookup - covered by ${area.name}`);
        res.json({
          covered: true,
          serviceArea: {
            id: area.id,
            name: area.name,
            state: area.state,
          },
        });
      } else {
        console.log(`[WebCompat] GET /service-areas/lookup - not covered (${lat}, ${lng})`);
        res.json({
          covered: false,
          serviceArea: null,
        });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[WebCompat] GET /service-areas/lookup error:", msg);
      res.status(500).json({ error: "Service area lookup failed", details: msg, covered: false });
    }
  });

  console.log("[WebCompat] Registered compatibility routes: /quotes, /jobs, /jobs/:id, /jobs/:id/pay, /service-areas/lookup");
}
