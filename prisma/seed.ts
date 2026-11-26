import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { DUMMY_PROJECT_DOCUMENTS } from "./seeds/documents";
import { DUMMY_EMERGENCY_FUNDS } from "./seeds/emergency";
import { DUMMY_LOGISTIC_ITEMS } from "./seeds/logistics";
import { DUMMY_PROJECT_MEMBERS } from "./seeds/members";
import { DUMMY_PROJECTS } from "./seeds/projects";
import {
  DUMMY_REPORT_COMMENTS,
  DUMMY_REPORT_MEDIA,
} from "./seeds/report-extras";
import { DUMMY_REPORTS } from "./seeds/reports";
import { DEFAULT_SEED_PASSWORD, DUMMY_USERS } from "./seeds/users";

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function main() {
  console.log("⏳ Start seeding database...");

  // 1. Seed Users (Global Roles: ADMIN, EXECUTIVE, USER, NONE)
  console.log("👤 Seeding users...");
  for (const user of DUMMY_USERS) {
    // Cari user berdasarkan email agar tidak bentrok jika akun Google sudah terdaftar
    const existing = await prisma.user.findFirst({
      where: { email: user.email },
    });

    let targetUserId = user.id;

    if (existing) {
      targetUserId = existing.id;
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: user.name,
          roleGlobal: user.roleGlobal,
          isActive: user.isActive,
          emailVerified: true,
          reviewedAt: user.isActive ? new Date() : null,
        },
      });
      console.log(
        `   - User updated: ${user.name} (${user.email}) -> Role: ${user.roleGlobal}`,
      );
    } else {
      await prisma.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          roleGlobal: user.roleGlobal,
          isActive: user.isActive,
          emailVerified: true,
          reviewedAt: user.isActive ? new Date() : null,
        },
      });
      console.log(
        `   - User created: ${user.name} (${user.email}) -> Role: ${user.roleGlobal}`,
      );
    }

    // Hash dan pasangkan password ke tabel Account (Better Auth credential provider)
    const rawPassword = user.password ?? DEFAULT_SEED_PASSWORD;
    const hashedPassword = await hashPassword(rawPassword);
    const credentialAccountId = `account_${targetUserId}_credential`;

    await prisma.account.upsert({
      where: { id: credentialAccountId },
      update: {
        password: hashedPassword,
        accountId: targetUserId,
      },
      create: {
        id: credentialAccountId,
        userId: targetUserId,
        accountId: targetUserId,
        providerId: "credential",
        password: hashedPassword,
      },
    });
    console.log(`     └─ Password set for ${user.email} ("${rawPassword}")`);
  }

  // 2. Seed Projects
  console.log("📂 Seeding projects...");
  for (const project of DUMMY_PROJECTS) {
    const upserted = await prisma.project.upsert({
      where: { id: project.id },
      update: {
        name: project.name,
        slug: project.slug,
        shortId: project.shortId,
        storageKey: project.storageKey,
        description: project.description,
        location: project.location,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
      },
      create: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        shortId: project.shortId,
        storageKey: project.storageKey,
        description: project.description,
        location: project.location,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
      },
    });
    console.log(`   - Project upserted: ${upserted.name} (${upserted.slug})`);
  }

  // 3. Seed Project Members (Project-Based Roles: SUPERVISOR, ARCHITECT, FINANCE, LOGISTIC)
  console.log("👥 Seeding project members...");
  for (const member of DUMMY_PROJECT_MEMBERS) {
    const user = await prisma.user.findFirst({
      where: { email: member.userEmail },
    });
    const project = await prisma.project.findFirst({
      where: {
        OR: [{ slug: member.projectSlug }, { id: member.projectSlug }],
      },
    });

    if (user && project) {
      await prisma.projectMember.upsert({
        where: {
          userId_projectId: {
            userId: user.id,
            projectId: project.id,
          },
        },
        update: {
          role: member.role,
        },
        create: {
          userId: user.id,
          projectId: project.id,
          role: member.role,
        },
      });
      console.log(
        `   - Member assigned: ${user.name} -> ${project.name} (${member.role})`,
      );
    }
  }

  // 4. Seed Daily Reports & Daily Report Tasks
  console.log("📝 Seeding daily reports...");
  for (const report of DUMMY_REPORTS) {
    // Resolve user ID for the report author
    const author =
      (await prisma.user.findUnique({ where: { id: report.userId } })) ??
      (await prisma.user.findFirst({
        where: { email: "supervisor@sandaran.id" },
      }));

    if (!author) continue;

    // Upsert DailyReport
    const upsertedReport = await prisma.dailyReport.upsert({
      where: {
        projectId_slug: {
          projectId: report.projectId,
          slug: report.slug,
        },
      },
      update: {
        userId: author.id,
        reportDate: report.reportDate,
        taskDescription: report.taskDescription,
        progressPercent: report.progressPercent,
        issues: report.issues,
        weather: report.weather,
        totalWorkers: report.totalWorkers,
        location: report.location,
      },
      create: {
        id: report.id,
        projectId: report.projectId,
        userId: author.id,
        slug: report.slug,
        reportDate: report.reportDate,
        taskDescription: report.taskDescription,
        progressPercent: report.progressPercent,
        issues: report.issues,
        weather: report.weather,
        totalWorkers: report.totalWorkers,
        location: report.location,
      },
    });
    console.log(`   - Daily report upserted: ${upsertedReport.slug}`);

    // Hapus tugas-tugas lama dari report ini (biar idempotent dan tidak duplikat)
    await prisma.dailyReportTask.deleteMany({
      where: { reportId: upsertedReport.id },
    });

    // Masukkan tugas baru
    for (const task of report.tasks) {
      await prisma.dailyReportTask.create({
        data: {
          reportId: upsertedReport.id,
          taskName: task.taskName,
          workerCount: task.workerCount,
          progress: task.progress,
          notes: task.notes,
        },
      });
    }
    console.log(`     └─ Seeded ${report.tasks.length} tasks for report.`);
  }

  // Helper: map email -> actual userId in DB (safe if user already registered via OAuth)
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true },
  });
  const userIdByEmail = new Map(allUsers.map((u) => [u.email, u.id]));

  // 5. Seed Report Media
  console.log("🖼️ Seeding report media...");
  for (const media of DUMMY_REPORT_MEDIA) {
    await prisma.reportMedia.upsert({
      where: { id: media.id },
      update: {
        reportId: media.reportId,
        publicId: media.publicId,
        url: media.url,
        resourceType: media.resourceType,
        fileName: media.fileName,
        fileSize: media.fileSize,
        mimeType: media.mimeType,
      },
      create: {
        id: media.id,
        reportId: media.reportId,
        publicId: media.publicId,
        url: media.url,
        resourceType: media.resourceType,
        fileName: media.fileName,
        fileSize: media.fileSize,
        mimeType: media.mimeType,
      },
    });
  }
  console.log(`   - Upserted ${DUMMY_REPORT_MEDIA.length} report media items.`);

  // 6. Seed Report Comments
  console.log("💬 Seeding report comments...");
  for (const comment of DUMMY_REPORT_COMMENTS) {
    const authorId = userIdByEmail.get(comment.userEmail);
    if (!authorId) continue;

    await prisma.reportComment.upsert({
      where: { id: comment.id },
      update: {
        reportId: comment.reportId,
        userId: authorId,
        content: comment.content,
      },
      create: {
        id: comment.id,
        reportId: comment.reportId,
        userId: authorId,
        content: comment.content,
      },
    });
  }
  console.log(`   - Upserted ${DUMMY_REPORT_COMMENTS.length} report comments.`);

  // 7. Seed Project Documents
  console.log("📄 Seeding project documents...");
  for (const doc of DUMMY_PROJECT_DOCUMENTS) {
    const uploaderId = userIdByEmail.get(doc.uploaderEmail);
    if (!uploaderId) continue;

    await prisma.projectDocument.upsert({
      where: { id: doc.id },
      update: {
        projectId: doc.projectId,
        userId: uploaderId,
        fileName: doc.fileName,
        fileType: doc.fileType,
        publicId: doc.publicId,
        url: doc.url,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        resourceType: doc.resourceType,
        title: doc.title,
        description: doc.description,
        version: doc.version,
      },
      create: {
        id: doc.id,
        projectId: doc.projectId,
        userId: uploaderId,
        fileName: doc.fileName,
        fileType: doc.fileType,
        publicId: doc.publicId,
        url: doc.url,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        resourceType: doc.resourceType,
        title: doc.title,
        description: doc.description,
        version: doc.version,
      },
    });
  }
  console.log(
    `   - Upserted ${DUMMY_PROJECT_DOCUMENTS.length} project documents.`,
  );

  // 8. Seed Emergency Funds & Emergency Transactions
  console.log("💰 Seeding emergency funds & transactions...");
  for (const fund of DUMMY_EMERGENCY_FUNDS) {
    const upsertedFund = await prisma.emergencyFund.upsert({
      where: { projectId: fund.projectId },
      update: {
        currentBalance: fund.currentBalance,
      },
      create: {
        id: fund.id,
        projectId: fund.projectId,
        currentBalance: fund.currentBalance,
      },
    });

    for (const tx of fund.transactions) {
      const requestedById = userIdByEmail.get(tx.requestedByEmail);
      if (!requestedById) continue;

      const verifiedById = tx.verifiedByEmail
        ? (userIdByEmail.get(tx.verifiedByEmail) ?? null)
        : null;
      const createdAt = daysAgo(tx.daysAgo);
      const verifiedAt =
        tx.status === "REVIEWED" ? daysAgo(Math.max(0, tx.daysAgo - 1)) : null;

      await prisma.emergencyTransaction.upsert({
        where: { id: tx.id },
        update: {
          fundId: upsertedFund.id,
          requestedById,
          verifiedById,
          verifiedAt,
          amount: tx.amount,
          description: tx.description,
          type: tx.type,
          status: tx.status,
          publicId: tx.publicId ?? null,
          url: tx.url ?? null,
        },
        create: {
          id: tx.id,
          fundId: upsertedFund.id,
          requestedById,
          verifiedById,
          verifiedAt,
          amount: tx.amount,
          description: tx.description,
          type: tx.type,
          status: tx.status,
          publicId: tx.publicId ?? null,
          url: tx.url ?? null,
          createdAt,
        },
      });
    }
    console.log(
      `   - EmergencyFund upserted for ${fund.projectId} (${fund.transactions.length} transactions).`,
    );
  }

  // 9. Seed Logistic Items & Logistic Transactions
  console.log("📦 Seeding logistic items & transactions...");
  for (const item of DUMMY_LOGISTIC_ITEMS) {
    const upsertedItem = await prisma.logisticItem.upsert({
      where: {
        projectId_slug: {
          projectId: item.projectId,
          slug: item.slug,
        },
      },
      update: {
        name: item.name,
        unit: item.unit,
      },
      create: {
        id: item.id,
        projectId: item.projectId,
        slug: item.slug,
        name: item.name,
        unit: item.unit,
      },
    });

    for (const tx of item.transactions) {
      const userId = userIdByEmail.get(tx.userEmail);
      if (!userId) continue;

      await prisma.logisticTransaction.upsert({
        where: { id: tx.id },
        update: {
          itemId: upsertedItem.id,
          userId,
          type: tx.type,
          quantity: tx.quantity,
          notes: tx.notes,
        },
        create: {
          id: tx.id,
          itemId: upsertedItem.id,
          userId,
          type: tx.type,
          quantity: tx.quantity,
          notes: tx.notes,
          createdAt: daysAgo(tx.daysAgo),
        },
      });
    }
    console.log(
      `   - LogisticItem upserted: ${item.name} (${item.transactions.length} transactions).`,
    );
  }

  console.log("✨ Database seeding finished successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
