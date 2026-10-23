import type { PrismaClient, ProjectRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";
import {
  checkCEORestriction,
  checkExecutiveRestriction,
  getProjectRole,
  isAdminOrCEO,
  isAdminOrExecutive,
  requireAdmin,
  requireOwnership,
  requireProjectMembership,
  requireProjectRole,
} from "./permission";

describe("permission helpers", () => {
  describe("isAdminOrExecutive", () => {
    it("returns true for ADMIN and EXECUTIVE", () => {
      expect(isAdminOrExecutive("ADMIN")).toBe(true);
      expect(isAdminOrExecutive("EXECUTIVE")).toBe(true);
      expect(isAdminOrCEO("ADMIN")).toBe(true);
      expect(isAdminOrCEO("EXECUTIVE")).toBe(true);
    });

    it("returns false for USER, NONE, or undefined/null", () => {
      expect(isAdminOrExecutive("USER")).toBe(false);
      expect(isAdminOrExecutive("NONE")).toBe(false);
      expect(isAdminOrExecutive(null)).toBe(false);
      expect(isAdminOrExecutive(undefined)).toBe(false);
    });
  });

  describe("requireAdmin", () => {
    it("passes without throwing if role is ADMIN", () => {
      expect(() => requireAdmin("ADMIN")).not.toThrow();
    });

    it("throws FORBIDDEN TRPCError if role is not ADMIN", () => {
      expect(() => requireAdmin("EXECUTIVE")).toThrow(TRPCError);
      expect(() => requireAdmin("USER")).toThrow(TRPCError);
      expect(() => requireAdmin(null)).toThrow(TRPCError);

      try {
        requireAdmin("USER", "Kustom pesan admin");
      } catch (err) {
        expect(err).toBeInstanceOf(TRPCError);
        expect((err as TRPCError).code).toBe("FORBIDDEN");
        expect((err as TRPCError).message).toBe("Kustom pesan admin");
      }
    });
  });

  describe("requireOwnership", () => {
    it("allows ADMIN to bypass ownership regardless of entity owner", () => {
      const entity = { userId: "user-123" };
      expect(() =>
        requireOwnership(entity, "different-user", "ADMIN"),
      ).not.toThrow();
    });

    it("allows owner matching userId", () => {
      const entity = { userId: "user-123" };
      expect(() => requireOwnership(entity, "user-123", "USER")).not.toThrow();
    });

    it("allows owner matching requestedById (e.g. emergency transactions)", () => {
      const entity = { requestedById: "user-123" };
      expect(() => requireOwnership(entity, "user-123", "USER")).not.toThrow();
    });

    it("throws NOT_FOUND if entity is missing and user is not ADMIN", () => {
      expect(() => requireOwnership(null, "user-123", "USER")).toThrow(
        TRPCError,
      );
    });

    it("throws FORBIDDEN if user is not owner and not ADMIN", () => {
      const entity = { userId: "owner-id" };
      try {
        requireOwnership(
          entity,
          "other-id",
          "USER",
          "Hanya pemilik yang dapat mengubah",
        );
      } catch (err) {
        expect(err).toBeInstanceOf(TRPCError);
        expect((err as TRPCError).code).toBe("FORBIDDEN");
        expect((err as TRPCError).message).toBe(
          "Hanya pemilik yang dapat mengubah",
        );
      }
    });
  });

  describe("checkExecutiveRestriction", () => {
    it("allows non-EXECUTIVE roles without error", () => {
      expect(() =>
        checkExecutiveRestriction("ADMIN", "ANY_MUTATION"),
      ).not.toThrow();
      expect(() =>
        checkExecutiveRestriction("USER", "ANY_MUTATION"),
      ).not.toThrow();
      expect(() => checkCEORestriction(null, "ANY_MUTATION")).not.toThrow();
    });

    it("allows EXECUTIVE for whitelisted actions", () => {
      expect(() =>
        checkExecutiveRestriction("EXECUTIVE", "PROFILE_EDIT_OWN"),
      ).not.toThrow();
      expect(() =>
        checkExecutiveRestriction("EXECUTIVE", "REPORT_COMMENT_CREATE"),
      ).not.toThrow();
      expect(() =>
        checkCEORestriction("EXECUTIVE", "REPORT_COMMENT_CREATE"),
      ).not.toThrow();
    });

    it("throws FORBIDDEN for EXECUTIVE on disallowed actions", () => {
      expect(() =>
        checkExecutiveRestriction("EXECUTIVE", "PROJECT_CREATE_MUTATION"),
      ).toThrow(TRPCError);
    });
  });

  describe("project role helpers with mock Prisma", () => {
    it("getProjectRole returns role or null", async () => {
      const mockDb = {
        projectMember: {
          findUnique: vi
            .fn()
            .mockResolvedValueOnce({ role: "SUPERVISOR" as ProjectRole })
            .mockResolvedValueOnce(null),
        },
      } as unknown as PrismaClient;

      const role = await getProjectRole(mockDb, "u1", "p1");
      expect(role).toBe("SUPERVISOR");

      const nullRole = await getProjectRole(mockDb, "u2", "p1");
      expect(nullRole).toBeNull();
    });

    it("requireProjectMembership returns role or throws FORBIDDEN", async () => {
      const mockDb = {
        projectMember: {
          findUnique: vi
            .fn()
            .mockResolvedValueOnce({ role: "ARCHITECT" as ProjectRole })
            .mockResolvedValueOnce(null),
        },
      } as unknown as PrismaClient;

      const role = await requireProjectMembership(mockDb, "u1", "p1");
      expect(role).toBe("ARCHITECT");

      await expect(
        requireProjectMembership(mockDb, "u2", "p1"),
      ).rejects.toThrow(TRPCError);
    });

    it("requireProjectRole validates allowed roles", async () => {
      const mockDb = {
        projectMember: {
          findUnique: vi
            .fn()
            .mockResolvedValue({ role: "SUPERVISOR" as ProjectRole }),
        },
      } as unknown as PrismaClient;

      const role = await requireProjectRole(mockDb, "u1", "p1", [
        "SUPERVISOR",
        "LOGISTIC",
      ]);
      expect(role).toBe("SUPERVISOR");

      await expect(
        requireProjectRole(mockDb, "u1", "p1", ["FINANCE", "ARCHITECT"]),
      ).rejects.toThrow(TRPCError);
    });
  });
});
