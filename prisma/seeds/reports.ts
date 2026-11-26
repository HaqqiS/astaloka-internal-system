import type { DailyReport, DailyReportTask } from "@prisma/client";

export interface DummyDailyReport extends Omit<DailyReport, "createdAt"> {
  tasks: Omit<DailyReportTask, "id" | "reportId" | "createdAt" | "updatedAt">[];
}

export const DUMMY_REPORTS: DummyDailyReport[] = [
  {
    id: "rep_sadara_1",
    projectId: "proj_sadara_boutique",
    userId: "user_mandor_1",
    slug: "laporan-harian-2026-06-08",
    reportDate: new Date("2026-06-08T00:00:00.000Z"),
    taskDescription:
      "Pekerjaan plesteran dinding lobi utama lantai 1 dan instalasi perkabelan ceiling.",
    progressPercent: 45,
    issues:
      "Pengiriman semen sempat terlambat 2 jam, namun pekerjaan tetap dapat diselesaikan sesuai target harian.",
    weather: "Cerah",
    totalWorkers: 8,
    location: "Lobi Utama Lantai 1",
    tasks: [
      {
        taskName: "Plesteran dinding area resepsionis",
        workerCount: 5,
        progress: 60,
        notes: "Menggunakan semen instan.",
      },
      {
        taskName: "Instalasi jalur kabel lampu ceiling",
        workerCount: 3,
        progress: 30,
        notes: "Material kabel konduit cukup.",
      },
    ],
  },
  {
    id: "rep_sadara_2",
    projectId: "proj_sadara_boutique",
    userId: "user_mandor_1",
    slug: "laporan-harian-2026-06-09",
    reportDate: new Date("2026-06-09T00:00:00.000Z"),
    taskDescription:
      "Melanjutkan plesteran dinding lobi utama dan memulai pemasangan rangka hollow untuk plafon lobi.",
    progressPercent: 55,
    issues:
      "Hujan deras di siang hari, pengerjaan area luar (paving pintu masuk) ditunda.",
    weather: "Hujan",
    totalWorkers: 10,
    location: "Lobi Utama & Drop Off",
    tasks: [
      {
        taskName: "Penyelesaian plesteran dinding",
        workerCount: 4,
        progress: 90,
        notes: "Siap acian besok.",
      },
      {
        taskName: "Pemasangan rangka hollow plafon",
        workerCount: 4,
        progress: 40,
        notes: "Perlu tambahan hollow 4x4.",
      },
      {
        taskName: "Persiapan landasan paving",
        workerCount: 2,
        progress: 10,
        notes: "Terhenti karena hujan.",
      },
    ],
  },
  {
    id: "rep_ba_house_1",
    projectId: "proj_ba_house",
    userId: "user_mandor_2",
    slug: "laporan-harian-ba-house-2026-04-10",
    reportDate: new Date("2026-04-10T00:00:00.000Z"),
    taskDescription:
      "Pembersihan akhir (final clean up) seluruh ruangan, pengecatan finishing dinding interior, dan pemasangan saklar lampu.",
    progressPercent: 100,
    issues: "Tidak ada masalah, semua pekerjaan selesai tepat waktu.",
    weather: "Cerah",
    totalWorkers: 6,
    location: "Seluruh Area Rumah",
    tasks: [
      {
        taskName: "Pengecatan finishing/touch up interior",
        workerCount: 3,
        progress: 100,
        notes: "Menggunakan cat Jotun interior.",
      },
      {
        taskName: "Pemasangan saklar dan stop kontak",
        workerCount: 1,
        progress: 100,
        notes: "Merk Panasonic matte black.",
      },
      {
        taskName: "Pembersihan sisa material & debu konstruksi",
        workerCount: 2,
        progress: 100,
        notes: "Rumah siap diserahterimakan.",
      },
    ],
  },
  ...createSadaraPaginationReports(),
];

function createSadaraPaginationReports(): DummyDailyReport[] {
  const weathers = ["Cerah", "Mendung", "Hujan", "Hujan Deras"] as const;
  const locations = [
    "Lobi Utama Lantai 1",
    "Villa Suite 1 & 2",
    "Villa Suite 3 & 4",
    "Area Kolam & Deck Kayu",
    "Restoran & Bar Tropis",
    "Fasad Depan & Drop Off",
  ] as const;
  const taskTemplates = [
    {
      summary:
        "Pemasangan plafon gypsum lobi utama, perataan acian dinding interior, dan pengecekan elevasi lantai.",
      taskA: "Rangka & panel plafon gypsum",
      noteA: "Elevasi sesuai gambar kerja.",
      taskB: "Acian halus dinding interior",
      noteB: "Siap tahap cat dasar besok.",
      issue: null,
    },
    {
      summary:
        "Pemasangan batu alam palimanan pada dinding aksen dan waterproofing area kamar mandi suite.",
      taskA: "Pemasangan batu alam dinding aksen",
      noteA: "Nat rapi menggunakan mortar khusus.",
      taskB: "Aplikasi coating waterproofing kamar mandi",
      noteB: "Menunggu uji rendam 24 jam.",
      issue: "Kelembaban tinggi memperlambat pengeringan lapisan pertama.",
    },
    {
      summary:
        "Instalasi lantai kayu jati reklamasi dan perakitan kusen pintu geser aluminium bukaan lebar.",
      taskA: "Pemasangan flooring kayu jati",
      noteA: "Kadar air kayu sudah dicek.",
      taskB: "Penyetelan kusen & rel pintu geser",
      noteB: "Bukaan presisi dan lancar.",
      issue: null,
    },
    {
      summary:
        "Pekerjaan MEP lanjutan meliputi pemasangan titik lampu downlight, stop kontak, dan uji tekanan pipa air bersih.",
      taskA: "Terminasi titik lampu & saklar",
      noteA: "Jalur grup sudah diberi label.",
      taskB: "Uji tekan instalasi air bersih",
      noteB: "Tidak ditemukan kebocoran pada sambungan.",
      issue: "Satu kotak sambungan memerlukan penggantian seal karet.",
    },
    {
      summary:
        "Pengecatan dasar dan lapisan finishing interior villa serta pemasangan anyaman rotan pada panel dekoratif.",
      taskA: "Pengecatan dasar & finishing dinding",
      noteA: "Warna sesuai approval arsitek.",
      taskB: "Pemasangan panel anyaman rotan",
      noteB: "Pemasangan rangka bantu selesai.",
      issue: null,
    },
  ] as const;

  const reports: DummyDailyReport[] = [];
  const startUtcMs = Date.UTC(2026, 5, 10); // 2026-06-10T00:00:00.000Z

  for (let i = 0; i < 25; i++) {
    const reportNumber = i + 3; // rep_sadara_3 .. rep_sadara_27
    const reportDate = new Date(startUtcMs + i * 24 * 60 * 60 * 1000);
    const isoDate = reportDate.toISOString().slice(0, 10);
    const tpl = taskTemplates[i % taskTemplates.length] ?? taskTemplates[0];
    const weather = weathers[i % weathers.length] ?? "Cerah";
    const location = locations[i % locations.length] ?? "Lobi Utama Lantai 1";
    const progressPercent = Math.min(96, 57 + Math.floor((i * 39) / 24));
    const totalWorkers = 6 + ((i * 3) % 11); // 6..16 pekerja
    const workerA = Math.max(2, Math.ceil(totalWorkers / 2));
    const workerB = Math.max(1, totalWorkers - workerA);

    reports.push({
      id: `rep_sadara_${reportNumber}`,
      projectId: "proj_sadara_boutique",
      userId: i % 2 === 0 ? "user_supervisor_1" : "user_architect_1",
      slug: `laporan-harian-${isoDate}`,
      reportDate,
      taskDescription: `${tpl.summary} (Batch lapangan #${reportNumber})`,
      progressPercent,
      issues: tpl.issue,
      weather,
      totalWorkers,
      location,
      tasks: [
        {
          taskName: tpl.taskA,
          workerCount: workerA,
          progress: progressPercent,
          notes: tpl.noteA,
        },
        {
          taskName: tpl.taskB,
          workerCount: workerB,
          progress: Math.min(100, progressPercent + 5),
          notes: tpl.noteB,
        },
      ],
    });
  }

  return reports;
}
