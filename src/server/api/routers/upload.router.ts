import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  deleteCloudinaryAsset,
  generateUploadSignature,
} from "~/lib/cloudinary";
import { extractShortIdFromSlug } from "~/lib/slug-utils";
import { requireProjectMembership } from "~/server/api/helpers/permission";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const uploadRouter = createTRPCRouter({
  /**
   * Get signed upload params for client-side upload
   * Resolves the project permanent storageKey to prevent broken URLs upon project renames
   * Returns signature, timestamp, folder, cloudName, apiKey
   */
  getSignedUploadParams: protectedProcedure
    .input(
      z.object({
        projectSlug: z.string(),
        type: z.enum(["reports", "documents", "emergency"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const shortId = extractShortIdFromSlug(input.projectSlug);
      const project = await ctx.db.project.findFirst({
        where: {
          OR: [...(shortId ? [{ shortId }] : []), { slug: input.projectSlug }],
        },
        select: { id: true, storageKey: true, slug: true },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proyek tidak ditemukan",
        });
      }

      const { id: userId, roleGlobal } = ctx.session.user;

      if (roleGlobal === "EXECUTIVE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Eksekutif hanya memiliki akses baca dan tidak dapat mengunggah file",
        });
      }

      if (roleGlobal !== "ADMIN") {
        const role = await requireProjectMembership(ctx.db, userId, project.id);

        // Validate project-level role per upload type
        if (input.type === "documents" && role !== "ARCHITECT") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Hanya ARCHITECT yang dapat mengunggah dokumen proyek",
          });
        }

        if (
          input.type === "reports" &&
          role !== "SUPERVISOR" &&
          role !== "ARCHITECT"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Hanya SUPERVISOR dan ARCHITECT yang dapat mengunggah media laporan",
          });
        }

        if (
          input.type === "emergency" &&
          role !== "SUPERVISOR" &&
          role !== "FINANCE"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Hanya SUPERVISOR dan FINANCE yang dapat mengunggah bukti kas darurat",
          });
        }
      }

      const storageKey =
        project.storageKey ?? project.slug ?? input.projectSlug;

      const params = generateUploadSignature({
        projectSlug: storageKey,
        type: input.type,
      });
      return params;
    }),

  /**
   * Delete uploaded asset by publicId with ownership & scope validation
   */
  deleteAsset: protectedProcedure
    .input(
      z.object({
        publicId: z.string().min(1),
        resourceType: z.enum(["image", "raw", "video"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { publicId, resourceType } = input;
      const { id: userId, roleGlobal } = ctx.session.user;
      const isAdmin = roleGlobal === "ADMIN";

      if (roleGlobal === "EXECUTIVE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Eksekutif hanya memiliki akses baca dan tidak dapat menghapus aset",
        });
      }

      // Basic structure validation: must be inside app's astaloka root folder
      if (!publicId.startsWith("astaloka/") || publicId.includes("..")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Path aset tidak valid",
        });
      }

      if (!isAdmin) {
        // 1. Check if publicId is tied to a ProjectDocument
        const document = await ctx.db.projectDocument.findFirst({
          where: { publicId },
          select: { userId: true },
        });

        if (document) {
          if (document.userId !== userId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Anda tidak berhak menghapus aset ini",
            });
          }
        } else {
          // 2. Check if publicId is tied to a ReportMedia
          const media = await ctx.db.reportMedia.findFirst({
            where: { publicId },
            include: {
              report: {
                select: { userId: true },
              },
            },
          });

          if (media) {
            if (media.report.userId !== userId) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Anda tidak berhak menghapus aset ini",
              });
            }
          } else {
            // 3. Check if publicId is tied to an EmergencyTransaction
            const tx = await ctx.db.emergencyTransaction.findFirst({
              where: { publicId },
              select: { requestedById: true },
            });

            if (tx) {
              if (tx.requestedById !== userId) {
                throw new TRPCError({
                  code: "FORBIDDEN",
                  message: "Anda tidak berhak menghapus aset ini",
                });
              }
            } else {
              // 4. Asset not yet registered in database (e.g. cancelled client upload)
              // Path format: astaloka/{projectSlug}/{type}/{filename}
              const segments = publicId.split("/");
              const projectSlug = segments[1];

              if (!projectSlug) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Format path aset tidak valid",
                });
              }

              const project = await ctx.db.project.findFirst({
                where: {
                  OR: [
                    { storageKey: projectSlug },
                    { slug: projectSlug },
                    { shortId: projectSlug },
                  ],
                },
                select: { id: true },
              });

              if (!project) {
                throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Proyek terkait aset tidak ditemukan",
                });
              }

              if (!isAdmin) {
                await requireProjectMembership(ctx.db, userId, project.id);
              }
            }
          }
        }
      }

      await deleteCloudinaryAsset(publicId, { resourceType });
      return { success: true };
    }),
});
