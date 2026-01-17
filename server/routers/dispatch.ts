import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getJobById,
  updateJob,
  getAllDrivers,
  createJobOffer,
  getJobOffers,
  updateJobOffer,
  createJobAssignment,
} from "../db";

export const dispatchRouter = router({
  // Start dispatch process (find drivers)
  startDispatch: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const job = await getJobById(input.jobId);
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      if (job.status !== "dispatching") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Job must be in dispatching status",
        });
      }

      // Get online drivers in the service area
      const drivers = await getAllDrivers({
        status: "approved",
        isOnline: true,
      });

      if (drivers.length === 0) {
        await updateJob(input.jobId, { status: "no_coverage" });
        return {
          success: false,
          message: "No drivers available",
        };
      }

      // Create wave 1 offers (send to top 3 drivers)
      const wave1Drivers = drivers.slice(0, 3);
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

      for (const driver of wave1Drivers) {
        await createJobOffer({
          jobId: input.jobId,
          driverId: driver.id,
          wave: 1,
          expiresAt,
        });
      }

      return {
        success: true,
        offersCreated: wave1Drivers.length,
        wave: 1,
      };
    }),

  // Driver accepts offer
  acceptOffer: protectedProcedure
    .input(z.object({ offerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const offer = await updateJobOffer(input.offerId, {
        status: "accepted",
        respondedAt: new Date(),
      });

      if (!offer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offer not found" });
      }

      // Create job assignment
      await createJobAssignment({
        jobId: offer.jobId,
        driverId: offer.driverId,
      });

      // Update job status
      await updateJob(offer.jobId, { status: "assigned" });

      // TODO: Reject all other pending offers for this job
      // TODO: Notify customer that driver is assigned

      return {
        success: true,
        job: await getJobById(offer.jobId),
      };
    }),

  // Driver rejects offer
  rejectOffer: protectedProcedure
    .input(z.object({ offerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await updateJobOffer(input.offerId, {
        status: "rejected",
        respondedAt: new Date(),
      });

      // TODO: Check if all wave offers are rejected, then send next wave

      return { success: true };
    }),

  // Get pending offers for driver
  getMyOffers: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // TODO: Get driver ID from user
    // For now, return empty array
    return [];
  }),
});
