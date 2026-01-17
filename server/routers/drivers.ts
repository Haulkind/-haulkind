import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createDriver,
  getDriverById,
  getDriverByUserId,
  updateDriver,
  getAllDrivers,
  createDriverVehicle,
  getDriverVehicles,
} from "../db";

export const driversRouter = router({
  // Driver onboarding (create driver profile)
  onboard: protectedProcedure
    .input(
      z.object({
        licenseNumber: z.string(),
        licenseState: z.string(),
        licenseExpiry: z.string(), // ISO date
        vehicleType: z.string(),
        vehicleMake: z.string(),
        vehicleModel: z.string(),
        vehicleYear: z.number(),
        vehiclePlate: z.string(),
        vehicleState: z.string(),
        insuranceProvider: z.string(),
        insurancePolicy: z.string(),
        insuranceExpiry: z.string(), // ISO date
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if driver profile already exists
      const existing = await getDriverByUserId(ctx.user.id);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Driver profile already exists",
        });
      }

      // Create driver profile
      const driver = await createDriver({
        userId: ctx.user.id,
        licenseNumber: input.licenseNumber,
        licenseState: input.licenseState,
        licenseExpiry: new Date(input.licenseExpiry),
        insuranceProvider: input.insuranceProvider,
        insurancePolicy: input.insurancePolicy,
        insuranceExpiry: new Date(input.insuranceExpiry),
        status: "pending_approval",
      });

      if (!driver) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create driver profile",
        });
      }

      // Create vehicle record
      await createDriverVehicle({
        driverId: driver.id,
        vehicleType: input.vehicleType,
        make: input.vehicleMake,
        model: input.vehicleModel,
        year: input.vehicleYear,
        licensePlate: input.vehiclePlate,
        state: input.vehicleState,
      });

      return {
        success: true,
        driver,
        message: "Driver application submitted. We'll review and notify you within 24-48 hours.",
      };
    }),

  // Get driver profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const driver = await getDriverByUserId(ctx.user.id);
    if (!driver) {
      return null;
    }

    const vehicles = await getDriverVehicles(driver.id);

    return {
      ...driver,
      vehicles,
    };
  }),

  // Admin: List all drivers
  listAll: protectedProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      // TODO: Check if user is admin
      const filters = input || {};
      return await getAllDrivers(filters);
    }),

  // Admin: Approve driver
  approve: protectedProcedure
    .input(z.object({ driverId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // TODO: Check if user is admin

      return await updateDriver(input.driverId, {
        status: "approved",
        approvedAt: new Date(),
      });
    }),

  // Admin: Reject driver
  reject: protectedProcedure
    .input(
      z.object({
        driverId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Check if user is admin

      return await updateDriver(input.driverId, {
        status: "rejected",
      });
    }),

  // Driver: Go online
  goOnline: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const driver = await getDriverByUserId(ctx.user.id);
    if (!driver) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Driver profile not found",
      });
    }

    if (driver.status !== "approved") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Driver must be approved to go online",
      });
    }

    return await updateDriver(driver.id, { isOnline: true });
  }),

  // Driver: Go offline
  goOffline: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const driver = await getDriverByUserId(ctx.user.id);
    if (!driver) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Driver profile not found",
      });
    }

    return await updateDriver(driver.id, { isOnline: false });
  }),
});
