import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";
import { createJobPhoto, getJobPhotos } from "../db";

export const mediaRouter = router({
  // Generate upload URL for client-side upload
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        contentType: z.string(),
        jobId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Generate unique file key
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileKey = `uploads/${ctx.user.id}/${timestamp}-${random}-${input.filename}`;

      // For now, return the key - client will upload via separate endpoint
      return {
        fileKey,
        uploadUrl: `/api/media/upload`, // Client will POST here
      };
    }),

  // Upload file (called from client)
  upload: protectedProcedure
    .input(
      z.object({
        fileKey: z.string(),
        fileData: z.string(), // Base64 encoded
        contentType: z.string(),
        jobId: z.string().optional(),
        photoType: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Decode base64
      const buffer = Buffer.from(input.fileData, "base64");

      // Upload to S3
      const result = await storagePut(input.fileKey, buffer, input.contentType);

      // If associated with a job, create photo record
      if (input.jobId) {
        await createJobPhoto({
          jobId: input.jobId,
          photoType: input.photoType || "other",
          url: result.url,
          uploadedBy: ctx.user.id.toString(),
        });
      }

      return {
        success: true,
        url: result.url,
        key: result.key,
      };
    }),

  // Get photos for a job
  getJobPhotos: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        photoType: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // TODO: Check if user has access to this job
      return await getJobPhotos(input.jobId, input.photoType);
    }),
});
