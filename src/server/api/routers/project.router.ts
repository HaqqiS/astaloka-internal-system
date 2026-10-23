import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  buildCosmeticSlug,
  deriveShortId,
  extractShortIdFromSlug,
} from "~/lib/slug-utils";
import {
  isAdminOrExecutive,
  requireProjectMembership,
} from "~/server/api/helpers/permission";
import {
  adminProcedure,
  createTRPCRouter,
  projectProcedure,
  protectedProcedure,
  strictAdminProcedure,
} from "~/server/api/trpc";

/**
 * Project Router
 *
 * Handles project CRUD and member management.
 *
 * Permissions:
 * - ADMIN can create, update, delete projects
 * - ADMIN can manage project members
 * - All project members can view project details
 * - EXECUTIVE can view all projects (read-only)
 */

// All project members can view
const projectMemberProcedure = projectProcedure([
  "SUPERVISOR",
  "ARCHITECT",
  "FINANCE",
  "LOGISTIC",
]);

export const projectRouter = createTRPCRouter({
  /**
   * Create a new project
   * Only ADMIN can create projects
   */
  create: adminProcedure
    .input(
      z.object({
        name: z
          .string()
          .trim()
          .min(1, "Nama proyek wajib diisi")
          .max(100, "Nama proyek maksimal 100 karakter"),
        slug: z.string().trim().max(100).optional(),
        description: z.string().trim().max(3000).optional(),
        location: z.string().trim().max(255).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(["ACTIVE", "DONE", "PAUSED"]).default("ACTIVE"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.$transaction(async (tx) => {
        const tempSlug = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const created = await tx.project.create({
          data: {
            name: input.name,
            slug: tempSlug,
            description: input.description,
            location: input.location,
            startDate: input.startDate,
            endDate: input.endDate,
            status: input.status,
          },
        });

        const shortId = deriveShortId(created.id, 10);
        const cosmeticSlug = buildCosmeticSlug(input.name, shortId);
        const storageKey = cosmeticSlug;

        return await tx.project.update({
          where: { id: created.id },
          data: {
            slug: cosmeticSlug,
            shortId,
            storageKey,
          },
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        });
      });

      return project;
    }),

  /**
   * Get all projects
   * - CEO can view all projects
   * - USER sees only their projects
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { id: userId, roleGlobal } = ctx.session.user;

    // EXECUTIVE and ADMIN can see all projects
    if (roleGlobal === "EXECUTIVE" || roleGlobal === "ADMIN") {
      const projects = await ctx.db.project.findMany({
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          _count: {
            select: {
              dailyReports: true,
              documents: true,
              logistics: true,
            },
          },
          dailyReports: {
            take: 1,
            orderBy: { reportDate: "desc" },
            select: {
              id: true,
              reportDate: true,
              progressPercent: true,
              taskDescription: true,
            },
          },
          documents: {
            take: 2,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              fileName: true,
              createdAt: true,
              fileType: true,
            },
          },
          logistics: {
            take: 2,
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, unit: true },
          },
          emergencyFund: {
            select: {
              currentBalance: true,
              transactions: {
                take: 1,
                orderBy: { createdAt: "desc" },
                select: {
                  id: true,
                  amount: true,
                  type: true,
                  status: true,
                  createdAt: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return projects;
    }

    // Regular USER sees only their projects
    const projects = await ctx.db.project.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            dailyReports: true,
            documents: true,
            logistics: true,
          },
        },
        dailyReports: {
          take: 1,
          orderBy: { reportDate: "desc" },
          select: {
            id: true,
            reportDate: true,
            progressPercent: true,
            taskDescription: true,
          },
        },
        documents: {
          take: 2,
          orderBy: { createdAt: "desc" },
          select: { id: true, fileName: true, createdAt: true, fileType: true },
        },
        logistics: {
          take: 2,
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, unit: true },
        },
        emergencyFund: {
          select: {
            currentBalance: true,
            transactions: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                amount: true,
                type: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return projects;
  }),

  /**
   * Get project by ID
   * Project members + CEO can view
   */
  getById: projectMemberProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "ID Proyek wajib diisi"),
      }),
    )
    .query(async ({ ctx }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: ctx.projectId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  roleGlobal: true,
                },
              },
            },
          },
          emergencyFund: true,
          _count: {
            select: {
              dailyReports: true,
              documents: true,
              logistics: true,
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proyek tidak ditemukan",
        });
      }

      return project;
    }),

  /**
   * Get project by Slug
   * Project members + CEO can view
   */
  getBySlug: protectedProcedure
    .input(
      z.object({
        slug: z.string().trim().min(1, "Slug proyek wajib diisi"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id: userId, roleGlobal } = ctx.session.user;

      const shortId = extractShortIdFromSlug(input.slug);

      const includeConfig = {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                roleGlobal: true,
              },
            },
          },
        },
        emergencyFund: true,
        _count: {
          select: {
            dailyReports: true,
            documents: true,
            logistics: true,
          },
        },
      };

      let project = null;
      if (shortId) {
        project = await ctx.db.project.findUnique({
          where: { shortId },
          include: includeConfig,
        });
      }

      if (!project) {
        project = await ctx.db.project.findUnique({
          where: { slug: input.slug },
          include: includeConfig,
        });
      }

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proyek tidak ditemukan",
        });
      }

      // Check access: ADMIN/EXECUTIVE or Project Member
      if (isAdminOrExecutive(roleGlobal)) {
        return project;
      }

      const isMember = project.members.some(
        (member) => member.userId === userId,
      );
      if (!isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda bukan anggota dari proyek ini",
        });
      }

      return project;
    }),

  /**
   * Update project
   * Only ADMIN can update projects
   */
  update: adminProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "ID Proyek wajib diisi"),
        name: z
          .string()
          .trim()
          .min(1, "Nama proyek wajib diisi")
          .max(100)
          .optional(),
        slug: z.string().trim().max(100).optional(),
        description: z.string().trim().max(3000).optional(),
        location: z.string().trim().max(255).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(["ACTIVE", "DONE", "PAUSED"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get current project to check shortId and storageKey
      const currentProject = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: {
          id: true,
          name: true,
          slug: true,
          shortId: true,
          storageKey: true,
        },
      });

      if (!currentProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proyek tidak ditemukan",
        });
      }

      const shortId =
        currentProject.shortId || deriveShortId(currentProject.id, 10);
      const storageKey = currentProject.storageKey || currentProject.slug;

      // Recalculate cosmetic slug if name or slug changed
      let newSlug = currentProject.slug;
      if (input.name && input.name !== currentProject.name) {
        newSlug = buildCosmeticSlug(input.name, shortId);
      } else if (input.slug && input.slug !== currentProject.slug) {
        newSlug = input.slug.endsWith(shortId)
          ? input.slug
          : `${input.slug}-${shortId}`;
      }

      // Check slug uniqueness if changed
      if (newSlug !== currentProject.slug) {
        const existing = await ctx.db.project.findUnique({
          where: { slug: newSlug },
        });
        if (existing && existing.id !== input.projectId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Proyek dengan slug ini sudah terdaftar",
          });
        }
      }

      const project = await ctx.db.project.update({
        where: { id: input.projectId },
        data: {
          name: input.name,
          slug: newSlug,
          shortId,
          storageKey,
          description: input.description,
          location: input.location,
          startDate: input.startDate,
          endDate: input.endDate,
          status: input.status,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  roleGlobal: true,
                },
              },
            },
          },
        },
      });

      return project;
    }),

  /**
   * Delete project
   * Only ADMIN can delete projects
   */
  delete: strictAdminProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "ID Proyek wajib diisi"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.project.delete({
        where: { id: input.projectId },
      });

      return { success: true };
    }),

  /**
   * Add member to project
   * Only ADMIN can add members
   */
  addMember: adminProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "ID Proyek wajib diisi"),
        userId: z.string().min(1, "ID Pengguna wajib diisi"),
        role: z.enum(["SUPERVISOR", "ARCHITECT", "FINANCE", "LOGISTIC"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user exists and is active
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { id: true, isActive: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pengguna tidak ditemukan",
        });
      }

      if (!user.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Hanya pengguna aktif dan disetujui yang dapat ditambahkan ke proyek",
        });
      }

      // Check if project exists
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proyek tidak ditemukan",
        });
      }

      // Check if already a member
      const existing = await ctx.db.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: input.userId,
            projectId: input.projectId,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pengguna sudah menjadi anggota proyek ini",
        });
      }

      const member = await ctx.db.projectMember.create({
        data: {
          userId: input.userId,
          projectId: input.projectId,
          role: input.role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return member;
    }),

  /**
   * Update member role
   * Only ADMIN can update member roles
   */
  updateMemberRole: adminProcedure
    .input(
      z.object({
        memberId: z.string().min(1, "ID Anggota wajib diisi"),
        role: z.enum(["SUPERVISOR", "ARCHITECT", "FINANCE", "LOGISTIC"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.projectMember.update({
        where: { id: input.memberId },
        data: {
          role: input.role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return member;
    }),

  /**
   * Remove member from project
   * Only ADMIN can remove members
   */
  removeMember: adminProcedure
    .input(
      z.object({
        memberId: z.string().min(1, "ID Anggota wajib diisi"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.projectMember.delete({
        where: { id: input.memberId },
      });

      return { success: true };
    }),

  /**
   * Get project members
   * All project members can view
   */
  getMembers: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "ID Proyek wajib diisi"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id: userId, roleGlobal } = ctx.session.user;

      // Check access: ADMIN/EXECUTIVE or Project Member
      if (!isAdminOrExecutive(roleGlobal)) {
        await requireProjectMembership(ctx.db, userId, input.projectId);
      }

      const members = await ctx.db.projectMember.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              roleGlobal: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return members;
    }),
});
