import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createJob,
  getJobById,
  getAllJobs,
  updateJob,
  createHaulAwayDetails,
  createLaborOnlyDetails,
  createPayment,
  getCustomerByUserId,
  createCustomer,
} from "../db";

export const jobsRouter = router({
  // Create a new job (customer)
  create: protectedProcedure
    .input(
      z.object({
        serviceAreaId: z.string(),
        serviceType: z.enum(["HAUL_AWAY", "LABOR_ONLY"]),
        pickupAddress: z.string(),
        pickupLat: z.number(),
        pickupLon: z.number(),
        scheduledFor: z.string().optional(), // ISO date string
        specialInstructions: z.string().optional(),
        // Haul Away specific
        volumeCubicYards: z.number().optional(),
        volumeTier: z.enum(["1_8", "1_4", "1_2", "3_4", "full"]).optional(),
        addonIds: z.array(z.number()).optional(),
        // Labor Only specific
        estimatedHours: z.number().optional(),
        // Pricing
        subtotal: z.number(),
        platformFee: z.number(),
        totalAmount: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Get or create customer record
      let customer = await getCustomerByUserId(ctx.user.id);
      if (!customer) {
        customer = await createCustomer({
          userId: ctx.user.id,
        });
      }

      if (!customer) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create customer",
        });
      }

      // Create job
      const job = await createJob({
        customerId: customer.id,
        serviceAreaId: input.serviceAreaId,
        serviceType: input.serviceType,
        status: "draft",
        pickupAddress: input.pickupAddress,
        pickupLat: input.pickupLat.toString(),
        pickupLon: input.pickupLon.toString(),
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
        specialInstructions: input.specialInstructions,
        subtotal: input.subtotal.toString(),
        platformFee: input.platformFee.toString(),
        totalAmount: input.totalAmount.toString(),
      });

      if (!job) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create job",
        });
      }

      // Create service-specific details
      if (input.serviceType === "HAUL_AWAY" && input.volumeTier) {
        await createHaulAwayDetails({
          jobId: job.id,
          volumeCubicYards: input.volumeCubicYards?.toString() || "0",
          volumeTier: input.volumeTier,
          disposalCostActual: "0",
        });
      } else if (input.serviceType === "LABOR_ONLY" && input.estimatedHours) {
        await createLaborOnlyDetails({
          jobId: job.id,
          estimatedHours: input.estimatedHours.toString(),
          actualHours: input.estimatedHours.toString(),
        });
      }

      return job;
    }),

  // Get job by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const job = await getJobById(input.id);
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      // TODO: Check if user has access to this job (customer, driver, or admin)

      return job;
    }),

  // List jobs (with filters)
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
          customerId: z.number().optional(),
          driverId: z.number().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      // TODO: Filter based on user role
      const filters = input || {};
      return await getAllJobs(filters);
    }),

  // Update job status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "draft",
          "quoted",
          "dispatching",
          "assigned",
          "en_route",
          "arrived",
          "started",
          "completed",
          "cancelled",
          "no_coverage",
        ]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate status transitions
      // TODO: Check permissions (only driver/admin can update certain statuses)

      return await updateJob(input.id, { status: input.status });
    }),

  // Process payment for job
  pay: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        paymentMethod: z.string(),
        paymentIntentId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const job = await getJobById(input.jobId);
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      if (job.status !== "draft" && job.status !== "quoted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Job has already been paid or cancelled",
        });
      }

      // Create payment record
      const payment = await createPayment({
        jobId: job.id,
        customerId: job.customerId,
        amount: job.total || "0",
        provider: input.paymentMethod,
        providerRef: input.paymentIntentId,
        status: "succeeded",
      });

      // Update job status to dispatching
      await updateJob(job.id, { status: "dispatching", paidAt: new Date() });

      // Trigger dispatch system to find driver
      try {
        // Get online approved drivers
        const { getAllDrivers, createJobOffer } = await import("../db");
        const drivers = await getAllDrivers({
          status: "approved",
          isOnline: true,
        });

        if (drivers.length > 0) {
          // Create wave 1 offers (send to top 3 drivers)
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
          console.log(`[Dispatch] Created ${wave1Drivers.length} job offers for job ${job.id}`);
        } else {
          // No drivers available
          await updateJob(job.id, { status: "no_coverage" });
          console.log(`[Dispatch] No drivers available for job ${job.id}`);
        }
      } catch (dispatchError) {
        console.error('[Dispatch] Error creating job offers:', dispatchError);
        // Don't fail the payment if dispatch fails
      }

      return {
        success: true,
        payment,
        job: await getJobById(job.id),
      };
    }),

  // Cancel job
  cancel: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const job = await getJobById(input.jobId);
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      // TODO: Check if cancellation is allowed based on status
      // TODO: Process refund if already paid

      return await updateJob(job.id, {
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: input.reason,
      });
    }),
});
