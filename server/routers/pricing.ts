import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getServiceAreaById,
  getVolumePricing,
  getDisposalCaps,
  getAddons,
  getDistanceRules,
  getLaborRates,
} from "../db";

// Volume tier mappings (cubic yards)
const VOLUME_TIERS = {
  "1_8": { min: 0, max: 3, label: "1/8 truck" },
  "1_4": { min: 3, max: 6, label: "1/4 truck" },
  "1_2": { min: 6, max: 12, label: "1/2 truck" },
  "3_4": { min: 12, max: 18, label: "3/4 truck" },
  full: { min: 18, max: 24, label: "Full truck" },
};

// Addon type labels
const ADDON_LABELS: Record<string, { name: string; description: string }> = {
  stairs_1: { name: "1 Flight of Stairs", description: "Additional charge for 1 flight of stairs" },
  stairs_2plus: { name: "2+ Flights of Stairs", description: "Additional charge for 2 or more flights" },
  long_carry: { name: "Long Carry", description: "Items require extended distance carry" },
  heavy: { name: "Heavy Items", description: "Extra heavy or bulky items" },
  mattress: { name: "Mattress Disposal", description: "Special mattress disposal fee" },
  appliances: { name: "Appliance Removal", description: "Refrigerator, washer, dryer, etc." },
  same_day: { name: "Same-Day Service", description: "Rush service for same-day pickup" },
};

function getVolumeTier(cubicYards: number): keyof typeof VOLUME_TIERS | null {
  for (const [tier, range] of Object.entries(VOLUME_TIERS)) {
    if (cubicYards >= range.min && cubicYards < range.max) {
      return tier as keyof typeof VOLUME_TIERS;
    }
  }
  // If exceeds max, use full truck
  if (cubicYards >= 18) return "full";
  return null;
}

export const pricingRouter = router({
  // Calculate quote for HAUL_AWAY service
  calculateHaulAway: publicProcedure
    .input(
      z.object({
        serviceAreaId: z.string(),
        volumeCubicYards: z.number().positive(),
        distanceMiles: z.number().nonnegative(),
        addonIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const serviceArea = await getServiceAreaById(input.serviceAreaId);
      if (!serviceArea) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service area not found",
        });
      }

      // Determine volume tier
      const volumeTier = getVolumeTier(input.volumeCubicYards);
      if (!volumeTier) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid volume amount",
        });
      }

      // Get pricing data
      const volumePrices = await getVolumePricing(input.serviceAreaId);
      const disposalCaps = await getDisposalCaps(input.serviceAreaId);
      const distanceRules = await getDistanceRules(input.serviceAreaId);
      const availableAddons = await getAddons(input.serviceAreaId);

      // Find volume price for tier
      const volumePriceData = volumePrices.find((vp) => vp.volumeTier === volumeTier);
      const volumePrice = volumePriceData ? parseFloat(volumePriceData.basePrice) : 0;

      // Calculate distance surcharge
      let distanceFee = 0;
      const sortedDistanceRules = distanceRules.sort(
        (a, b) => parseFloat(a.minMiles) - parseFloat(b.minMiles)
      );

      for (const rule of sortedDistanceRules) {
        const minMiles = parseFloat(rule.minMiles);
        const maxMiles = rule.maxMiles ? parseFloat(rule.maxMiles) : Infinity;

        if (input.distanceMiles >= minMiles && input.distanceMiles <= maxMiles) {
          distanceFee = parseFloat(rule.surcharge);
          break;
        }
      }

      // Calculate addons
      let addonsTotal = 0;
      const selectedAddons = [];
      if (input.addonIds && input.addonIds.length > 0) {
        for (const addonId of input.addonIds) {
          const addon = availableAddons.find((a) => a.id === addonId);
          if (addon) {
            addonsTotal += parseFloat(addon.price);
            const addonInfo = ADDON_LABELS[addon.addonType] || {
              name: addon.addonType,
              description: "",
            };
            selectedAddons.push({
              id: addon.id,
              name: addonInfo.name,
              price: parseFloat(addon.price),
            });
          }
        }
      }

      // Get disposal cap info
      const disposalCapData = disposalCaps.find((dc) => dc.volumeTier === volumeTier);
      const disposalCapAmount = disposalCapData ? parseFloat(disposalCapData.capAmount) : 0;

      const subtotal = volumePrice + distanceFee + addonsTotal;
      const platformFee = subtotal * 0.05; // 5% platform fee
      const total = subtotal + platformFee;

      return {
        serviceAreaId: input.serviceAreaId,
        serviceAreaName: serviceArea.name,
        serviceType: "HAUL_AWAY" as const,
        volumeCubicYards: input.volumeCubicYards,
        volumeTier,
        volumeTierLabel: VOLUME_TIERS[volumeTier].label,
        distanceMiles: input.distanceMiles,
        lineItems: [
          {
            description: `Haul Away (${VOLUME_TIERS[volumeTier].label})`,
            amount: volumePrice,
          },
          ...(distanceFee > 0
            ? [
                {
                  description: `Distance Surcharge (${input.distanceMiles.toFixed(1)} miles)`,
                  amount: distanceFee,
                },
              ]
            : []),
          ...selectedAddons.map((addon) => ({
            description: addon.name,
            amount: addon.price,
          })),
          {
            description: "Platform Fee (5%)",
            amount: platformFee,
          },
        ],
        subtotal,
        platformFee,
        total,
        disposalCapAmount,
        disposalCapMessage: `Includes disposal up to $${disposalCapAmount.toFixed(2)}. Additional disposal costs will be reimbursed with receipt.`,
      };
    }),

  // Calculate quote for LABOR_ONLY service
  calculateLaborOnly: publicProcedure
    .input(
      z.object({
        serviceAreaId: z.string(),
        hours: z.number().min(2), // 2-hour minimum
        distanceMiles: z.number().nonnegative(),
      })
    )
    .mutation(async ({ input }) => {
      const serviceArea = await getServiceAreaById(input.serviceAreaId);
      if (!serviceArea) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service area not found",
        });
      }

      // Get labor rates
      const laborRates = await getLaborRates(input.serviceAreaId);
      if (laborRates.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No labor rates configured for this service area",
        });
      }

      const laborRate = laborRates[0]; // Assume single rate per area
      const hourlyRate = parseFloat(laborRate.hourlyRate);

      // Calculate distance surcharge
      const distanceRules = await getDistanceRules(input.serviceAreaId);
      let distanceFee = 0;
      const sortedDistanceRules = distanceRules.sort(
        (a, b) => parseFloat(a.minMiles) - parseFloat(b.minMiles)
      );

      for (const rule of sortedDistanceRules) {
        const minMiles = parseFloat(rule.minMiles);
        const maxMiles = rule.maxMiles ? parseFloat(rule.maxMiles) : Infinity;

        if (input.distanceMiles >= minMiles && input.distanceMiles <= maxMiles) {
          distanceFee = parseFloat(rule.surcharge);
          break;
        }
      }

      const laborCost = hourlyRate * input.hours;
      const subtotal = laborCost + distanceFee;
      const platformFee = subtotal * 0.05; // 5% platform fee
      const total = subtotal + platformFee;

      return {
        serviceAreaId: input.serviceAreaId,
        serviceAreaName: serviceArea.name,
        serviceType: "LABOR_ONLY" as const,
        hours: input.hours,
        hourlyRate,
        distanceMiles: input.distanceMiles,
        lineItems: [
          {
            description: `Labor (${input.hours} hours @ $${hourlyRate}/hr)`,
            amount: laborCost,
          },
          ...(distanceFee > 0
            ? [
                {
                  description: `Distance Surcharge (${input.distanceMiles.toFixed(1)} miles)`,
                  amount: distanceFee,
                },
              ]
            : []),
          {
            description: "Platform Fee (5%)",
            amount: platformFee,
          },
        ],
        subtotal,
        platformFee,
        total,
        minimumHours: 2,
        note: "2-hour minimum. Additional time can be requested during the job.",
      };
    }),

  // Get available addons for service area
  getAddons: publicProcedure
    .input(z.object({ serviceAreaId: z.string() }))
    .query(async ({ input }) => {
      const addons = await getAddons(input.serviceAreaId);
      return addons.map((addon) => {
        const addonInfo = ADDON_LABELS[addon.addonType] || {
          name: addon.addonType,
          description: "",
        };
        return {
          id: addon.id,
          type: addon.addonType,
          name: addonInfo.name,
          description: addonInfo.description,
          price: parseFloat(addon.price),
        };
      });
    }),
});
