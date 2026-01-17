import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getJobById, updateJob, createPayout } from "../db";

export const ledgerRouter = router({
  // Finalize job and create payout
  finalizeJob: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        disposalCostActual: z.number().optional(),
        disposalReceiptUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const job = await getJobById(input.jobId);
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      if (job.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Job must be completed before finalization",
        });
      }

      // Calculate driver payout (60% of service price)
      const servicePrice = parseFloat(job.servicePrice || "0");
      const driverPayout = servicePrice * 0.6;

      // Calculate disposal reimbursement if applicable
      let disposalReimbursement = 0;
      if (input.disposalCostActual && job.disposalCap) {
        const cap = parseFloat(job.disposalCap);
        if (input.disposalCostActual > cap) {
          disposalReimbursement = input.disposalCostActual - cap;
        }
      }

      const totalPayout = driverPayout + disposalReimbursement;

      // Create payout record
      const payout = await createPayout({
        jobId: job.id,
        driverId: 0, // TODO: Get driver ID from job assignment
        driverPayout: driverPayout.toString(),
        disposalReimbursement: disposalReimbursement.toString(),
        totalAmount: totalPayout.toString(),
        disposalReceiptUrl: input.disposalReceiptUrl,
      });

      // Update job with payout info
      await updateJob(job.id, {
        completedAt: new Date(),
      });

      return {
        success: true,
        payout,
      };
    }),

  // Get payout history for driver
  getMyPayouts: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // TODO: Get driver ID and fetch payouts
      return [];
    }),
});
