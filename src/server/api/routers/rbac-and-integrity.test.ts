import type { GlobalRole, ProjectRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDeleteCloudinaryAsset, mockGenerateUploadSignature } = vi.hoisted(
  () => ({
    mockDeleteCloudinaryAsset: vi.fn().mockResolvedValue({ result: "ok" }),
    mockGenerateUploadSignature: vi.fn().mockReturnValue({
      signature: "sig",
      timestamp: 123456,
      folder: "astaloka/proj/reports",
      cloudName: "demo",
      apiKey: "key",
    }),
  }),
);

vi.mock("~/lib/cloudinary", () => ({
  deleteCloudinaryAsset: mockDeleteCloudinaryAsset,
  generateUploadSignature: mockGenerateUploadSignature,
  isValidCloudinaryUrl: (url: string) =>
    url.startsWith("https://res.cloudinary.com/"),
}));

vi.mock("~/server/db", () => ({
  db: {},
}));

vi.mock("~/server/better-auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { createCaller } from "~/server/api/root";

function makeSession(id: string, roleGlobal: GlobalRole, isActive = true) {
  return {
    session: {
      id: `sess-${id}`,
      token: `tok-${id}`,
      expiresAt: new Date(Date.now() + 86_400_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
      userId: id,
    },
    user: {
      id,
      name: `User ${id}`,
      email: `${id}@sandaran.id`,
      emailVerified: true,
      image: null,
      phoneNumber: null,
      phoneNumberVerified: false,
      roleGlobal,
      isActive,
      reviewedAt: new Date(),
      reviewedById: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

function makeCaller(
  roleGlobal: GlobalRole,
  dbMock: Record<string, unknown>,
  userId = `user-${roleGlobal.toLowerCase()}`,
) {
  return createCaller({
    headers: new Headers(),
    db: dbMock as never,
    session: makeSession(userId, roleGlobal) as never,
  });
}

describe("RBAC & Data Integrity Router Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("EXECUTIVE read-only + feedback comment policy", () => {
    it("blocks EXECUTIVE from admin, project, user, upload, and operational mutations", async () => {
      const dbMock = {
        projectMember: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        project: {
          findFirst: vi.fn().mockResolvedValue({
            id: "proj-1",
            storageKey: "proj-1",
            slug: "proj-1",
          }),
        },
      };

      const caller = makeCaller("EXECUTIVE", dbMock);

      await expect(
        caller.project.create({ name: "Proyek Baru" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(
        caller.project.update({ projectId: "proj-1", name: "Rename" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(
        caller.project.delete({ projectId: "proj-1" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(
        caller.project.addMember({
          projectId: "proj-1",
          userId: "u-1",
          role: "SUPERVISOR",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(
        caller.user.approveUser({ userId: "u-1", roleGlobal: "USER" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(
        caller.user.createUserWithCredentials({
          name: "Staf Baru",
          email: "staf@sandaran.id",
          password: "password123",
          roleGlobal: "USER",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(
        caller.upload.getSignedUploadParams({
          projectSlug: "proj-1",
          type: "reports",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(
        caller.upload.deleteAsset({
          publicId: "astaloka/proj-1/reports/file",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(
        caller.emergency.request({
          projectId: "proj-1",
          amount: 100_000,
          description: "Darurat",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(
        caller.logistic.createItem({
          projectId: "proj-1",
          name: "Semen",
          unit: "Sak",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("allows EXECUTIVE to post feedback comments on daily reports", async () => {
      const dbMock = {
        projectMember: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        dailyReport: {
          findFirst: vi.fn().mockResolvedValue({
            id: "rep-1",
            projectId: "proj-1",
          }),
        },
        reportComment: {
          create: vi.fn().mockResolvedValue({
            id: "cmt-1",
            content: "Percepat finishing lobi",
            author: {
              id: "user-executive",
              name: "Executive",
              image: null,
              roleGlobal: "EXECUTIVE",
            },
          }),
        },
      };

      const caller = makeCaller("EXECUTIVE", dbMock);
      const comment = await caller.comment.create({
        projectId: "proj-1",
        reportId: "rep-1",
        content: "Percepat finishing lobi",
      });

      expect(comment.id).toBe("cmt-1");
      expect(dbMock.reportComment.create).toHaveBeenCalledOnce();
    });
  });

  describe("Project role enforcement (LOGISTIC vs FINANCE)", () => {
    it("allows LOGISTIC and blocks FINANCE on logistic.createItem", async () => {
      const makeMemberDb = (role: ProjectRole) => ({
        projectMember: {
          findUnique: vi.fn().mockResolvedValue({ role }),
        },
        logisticItem: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({
            id: "item-1",
            name: "Semen",
            unit: "Sak",
            slug: "semen",
          }),
        },
      });

      const financeCaller = makeCaller(
        "USER",
        makeMemberDb("FINANCE"),
        "u-fin",
      );
      await expect(
        financeCaller.logistic.createItem({
          projectId: "proj-1",
          name: "Semen",
          unit: "Sak",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      const logisticDb = makeMemberDb("LOGISTIC");
      const logisticCaller = makeCaller("USER", logisticDb, "u-log");
      const created = await logisticCaller.logistic.createItem({
        projectId: "proj-1",
        name: "Semen",
        unit: "Sak",
      });
      expect(created.id).toBe("item-1");
    });
  });

  describe("Cross-project IDOR & NOT_FOUND checks for ADMIN on report mutations", () => {
    it("throws NOT_FOUND instead of mutating when report is not in ctx.projectId", async () => {
      const dbMock = {
        projectMember: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        dailyReport: {
          findFirst: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
        },
        dailyReportTask: {
          create: vi.fn(),
        },
        reportMedia: {
          create: vi.fn(),
        },
      };

      const adminCaller = makeCaller("ADMIN", dbMock);

      await expect(
        adminCaller.report.update({
          projectId: "proj-1",
          reportId: "rep-other-project",
          progressPercent: 90,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(dbMock.dailyReport.update).not.toHaveBeenCalled();

      await expect(
        adminCaller.report.addTask({
          projectId: "proj-1",
          reportId: "rep-other-project",
          taskName: "Illegal task",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(dbMock.dailyReportTask.create).not.toHaveBeenCalled();

      await expect(
        adminCaller.report.uploadMedia({
          projectId: "proj-1",
          reportId: "rep-other-project",
          publicId: "astaloka/proj-1/reports/pic",
          url: "https://res.cloudinary.com/demo/image/upload/v1/pic.jpg",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(dbMock.reportMedia.create).not.toHaveBeenCalled();
    });
  });

  describe("Cloudinary ordering & safe deletes", () => {
    it("does not delete Cloudinary asset when emergency.edit transaction fails", async () => {
      const dbMock = {
        projectMember: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        emergencyTransaction: {
          findUnique: vi.fn().mockResolvedValue({
            id: "tx-1",
            fundId: "fund-1",
            requestedById: "user-admin",
            amount: 500_000,
            description: "Nota",
            publicId: "astaloka/proj-1/emergency/old-proof",
            url: "https://res.cloudinary.com/demo/image/upload/v1/old.jpg",
            type: "WITHDRAWAL",
            status: "UNREVIEWED",
            fund: { projectId: "proj-1" },
          }),
        },
        $transaction: vi.fn().mockRejectedValue(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Saldo tidak mencukupi",
          }),
        ),
      };

      const adminCaller = makeCaller("ADMIN", dbMock);
      await expect(
        adminCaller.emergency.edit({
          projectId: "proj-1",
          transactionId: "tx-1",
          amount: 5_000_000,
          description: "Nota update",
          proofPublicId: "astaloka/proj-1/emergency/new-proof",
          proofUrl: "https://res.cloudinary.com/demo/image/upload/v1/new.jpg",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      expect(mockDeleteCloudinaryAsset).not.toHaveBeenCalled();
    });

    it("does not delete Cloudinary asset when document.delete DB delete fails", async () => {
      const dbMock = {
        projectMember: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        projectDocument: {
          findFirst: vi.fn().mockResolvedValue({
            id: "doc-1",
            projectId: "proj-1",
            userId: "user-admin",
            publicId: "astaloka/proj-1/documents/spec",
            resourceType: "raw",
          }),
          delete: vi.fn().mockRejectedValue(new Error("DB constraint failure")),
        },
      };

      const adminCaller = makeCaller("ADMIN", dbMock);
      await expect(
        adminCaller.document.delete({
          projectId: "proj-1",
          documentId: "doc-1",
        }),
      ).rejects.toThrow("DB constraint failure");

      expect(mockDeleteCloudinaryAsset).not.toHaveBeenCalled();
    });

    it("blocks user.deleteUser when user has historical records", async () => {
      const dbMock = {
        user: {
          findUnique: vi.fn().mockResolvedValue({
            isActive: false,
            roleGlobal: "USER",
            _count: {
              reports: 2,
              documents: 0,
              comments: 0,
              requests: 0,
              verifications: 0,
              logistics: 0,
            },
          }),
          delete: vi.fn(),
        },
      };

      const adminCaller = makeCaller("ADMIN", dbMock);
      await expect(
        adminCaller.user.deleteUser({ userId: "target-1" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(dbMock.user.delete).not.toHaveBeenCalled();
    });

    it("deletes project children transactionally before cleaning up Cloudinary assets", async () => {
      const txMock = {
        emergencyTransaction: { deleteMany: vi.fn() },
        emergencyFund: { deleteMany: vi.fn() },
        logisticItem: { deleteMany: vi.fn() },
        dailyReport: { deleteMany: vi.fn() },
        projectDocument: { deleteMany: vi.fn() },
        projectMember: { deleteMany: vi.fn() },
        project: { delete: vi.fn() },
      };

      const dbMock = {
        project: {
          findUnique: vi.fn().mockResolvedValue({
            id: "proj-1",
            documents: [
              {
                publicId: "astaloka/proj-1/documents/spec",
                resourceType: "raw",
              },
            ],
            dailyReports: [
              {
                media: [
                  {
                    publicId: "astaloka/proj-1/reports/photo",
                    resourceType: "image",
                  },
                ],
              },
            ],
            emergencyFund: {
              transactions: [{ publicId: "astaloka/proj-1/emergency/receipt" }],
            },
          }),
        },
        $transaction: vi.fn(
          async (cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock),
        ),
      };

      const adminCaller = makeCaller("ADMIN", dbMock);
      const res = await adminCaller.project.delete({ projectId: "proj-1" });

      expect(res.success).toBe(true);
      expect(txMock.project.delete).toHaveBeenCalledWith({
        where: { id: "proj-1" },
      });
      expect(mockDeleteCloudinaryAsset).toHaveBeenCalledTimes(3);
      expect(mockDeleteCloudinaryAsset).toHaveBeenCalledWith(
        "astaloka/proj-1/documents/spec",
        { resourceType: "raw" },
      );
    });
  });
});
