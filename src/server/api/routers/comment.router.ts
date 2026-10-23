import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { requireOwnership } from "~/server/api/helpers/permission";
import { createTRPCRouter, projectProcedure } from "~/server/api/trpc";

/**
 * Report Comment Router
 *
 * Handles comments on daily reports.
 *
 * Permissions:
 * - All project members can create comments (CEO ALLOWED!)
 * - All project members can view comments
 * - Only comment owner can edit/delete
 */

// All project members can comment (Executive allowed!)
const commentProcedure = projectProcedure(
  ["SUPERVISOR", "ARCHITECT", "FINANCE", "LOGISTIC"],
  {
    allowExecutive: true,
  },
);

// For viewing (no mutation, so Executive can access)
const projectMemberProcedure = projectProcedure([
  "SUPERVISOR",
  "ARCHITECT",
  "FINANCE",
  "LOGISTIC",
]);

export const commentRouter = createTRPCRouter({
  /**
   * Create a comment on a report
   * All project members can comment (CEO ALLOWED!)
   */
  create: commentProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "ID Proyek wajib diisi"),
        reportId: z.string().min(1, "ID Laporan wajib diisi"),
        content: z
          .string()
          .trim()
          .min(1, "Komentar tidak boleh kosong")
          .max(2000, "Komentar maksimal 2000 karakter"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify report exists in this project
      const report = await ctx.db.dailyReport.findFirst({
        where: {
          id: input.reportId,
          projectId: ctx.projectId,
        },
      });

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Laporan tidak ditemukan dalam proyek ini",
        });
      }

      const comment = await ctx.db.reportComment.create({
        data: {
          reportId: input.reportId,
          userId: ctx.session.user.id,
          content: input.content,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              roleGlobal: true,
            },
          },
        },
      });

      return comment;
    }),

  /**
   * Get all comments for a report
   * All project members can view
   */
  getByReport: projectMemberProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "ID Proyek wajib diisi"),
        reportId: z.string().min(1, "ID Laporan wajib diisi"),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify report exists in this project
      const report = await ctx.db.dailyReport.findFirst({
        where: {
          id: input.reportId,
          projectId: ctx.projectId,
        },
      });

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Laporan tidak ditemukan dalam proyek ini",
        });
      }

      const comments = await ctx.db.reportComment.findMany({
        where: {
          reportId: input.reportId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              roleGlobal: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return comments;
    }),

  /**
   * Update a comment
   * Only comment owner can update (CEO ALLOWED if they own it!)
   */
  update: commentProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "ID Proyek wajib diisi"),
        commentId: z.string().min(1, "ID Komentar wajib diisi"),
        content: z
          .string()
          .trim()
          .min(1, "Komentar tidak boleh kosong")
          .max(2000, "Komentar maksimal 2000 karakter"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get comment to check ownership
      const comment = await ctx.db.reportComment.findUnique({
        where: { id: input.commentId },
        include: {
          report: true,
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Komentar tidak ditemukan",
        });
      }

      // Verify comment belongs to a report in this project
      if (comment.report.projectId !== ctx.projectId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Komentar ini bukan bagian dari proyek ini",
        });
      }

      // Check ownership (ADMIN bypasses this)
      requireOwnership(
        comment,
        ctx.session.user.id,
        ctx.session.user.roleGlobal,
        "Hanya pembuat komentar yang dapat mengubah komentar ini",
      );

      const updated = await ctx.db.reportComment.update({
        where: { id: input.commentId },
        data: {
          content: input.content,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              roleGlobal: true,
            },
          },
        },
      });

      return updated;
    }),

  /**
   * Delete a comment
   * Only comment owner can delete (CEO ALLOWED if they own it!)
   */
  delete: commentProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "ID Proyek wajib diisi"),
        commentId: z.string().min(1, "ID Komentar wajib diisi"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get comment to check ownership
      const comment = await ctx.db.reportComment.findUnique({
        where: { id: input.commentId },
        include: {
          report: true,
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Komentar tidak ditemukan",
        });
      }

      // Verify comment belongs to a report in this project
      if (comment.report.projectId !== ctx.projectId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Komentar ini bukan bagian dari proyek ini",
        });
      }

      // Check ownership (ADMIN bypasses this)
      requireOwnership(
        comment,
        ctx.session.user.id,
        ctx.session.user.roleGlobal,
        "Hanya pembuat komentar yang dapat menghapus komentar ini",
      );

      await ctx.db.reportComment.delete({
        where: { id: input.commentId },
      });

      return { success: true };
    }),
});
