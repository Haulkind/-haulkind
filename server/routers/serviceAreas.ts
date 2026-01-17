import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getAllServiceAreas,
  getServiceAreaById,
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
  findServiceAreaByCoordinates,
} from "../db";

export const serviceAreasRouter = router({
  // Public: Get all service areas
  list: publicProcedure.query(async () => {
    return await getAllServiceAreas();
  }),

  // Public: Get service area by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const area = await getServiceAreaById(input.id);
      if (!area) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service area not found",
        });
      }
      return area;
    }),

  // Public: Check if coordinates are within service area
  checkCoverage: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
    )
    .query(async ({ input }) => {
      const area = await findServiceAreaByCoordinates(
        input.latitude,
        input.longitude
      );
      return {
        covered: !!area,
        serviceArea: area || null,
      };
    }),

  // Admin: Create service area
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        state: z.string().length(2),
        type: z.enum(["radius", "polygon"]),
        centerLat: z.number().min(-90).max(90),
        centerLng: z.number().min(-180).max(180),
        radiusMiles: z.number().positive().optional(),
        polygonGeoJson: z.any().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Add admin role check
      // if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });

      return await createServiceArea(input);
    }),

  // Admin: Update service area
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        state: z.string().length(2).optional(),
        type: z.enum(["radius", "polygon"]).optional(),
        centerLat: z.number().min(-90).max(90).optional(),
        centerLng: z.number().min(-180).max(180).optional(),
        radiusMiles: z.number().positive().optional(),
        polygonGeoJson: z.any().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Add admin role check

      const { id, ...updates } = input;
      return await updateServiceArea(id, updates);
    }),

  // Admin: Delete service area
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // TODO: Add admin role check

      return await deleteServiceArea(input.id);
    }),
});
