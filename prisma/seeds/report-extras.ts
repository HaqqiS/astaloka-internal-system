export interface DummyReportMedia {
  id: string;
  reportId: string;
  publicId: string;
  url: string;
  resourceType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface DummyReportComment {
  id: string;
  reportId: string;
  userEmail: string;
  content: string;
}

export const DUMMY_REPORT_MEDIA: DummyReportMedia[] = [
  {
    id: "media_sadara_1_a",
    reportId: "rep_sadara_1",
    publicId: "astaloka/sadara-boutique-resort/reports/plesteran-lobi-1",
    url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    resourceType: "image",
    fileName: "plesteran-dinding-lobi-1.jpg",
    fileSize: 245760,
    mimeType: "image/jpeg",
  },
  {
    id: "media_sadara_1_b",
    reportId: "rep_sadara_1",
    publicId: "astaloka/sadara-boutique-resort/reports/jalur-kabel-ceiling",
    url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    resourceType: "image",
    fileName: "instalasi-kabel-ceiling.jpg",
    fileSize: 198420,
    mimeType: "image/jpeg",
  },
  {
    id: "media_sadara_2_a",
    reportId: "rep_sadara_2",
    publicId: "astaloka/sadara-boutique-resort/reports/rangka-hollow-plafon",
    url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    resourceType: "image",
    fileName: "rangka-hollow-plafon-lobi.jpg",
    fileSize: 312500,
    mimeType: "image/jpeg",
  },
  {
    id: "media_ba_house_1_a",
    reportId: "rep_ba_house_1",
    publicId: "astaloka/b-a-house/reports/finishing-interior-final",
    url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    resourceType: "image",
    fileName: "finishing-interior-final.jpg",
    fileSize: 284100,
    mimeType: "image/jpeg",
  },
];

export const DUMMY_REPORT_COMMENTS: DummyReportComment[] = [
  {
    id: "comment_sadara_1_a",
    reportId: "rep_sadara_1",
    userEmail: "architect@sandaran.id",
    content:
      "Pastikan ketebalan plesteran di area resepsionis rata sebelum pemasangan panel kayu jati minggu depan.",
  },
  {
    id: "comment_sadara_1_b",
    reportId: "rep_sadara_1",
    userEmail: "supervisor@sandaran.id",
    content:
      "Siap Pak Aris, sudah kami cek menggunakan waterpass dan hasilnya rata.",
  },
  {
    id: "comment_sadara_2_a",
    reportId: "rep_sadara_2",
    userEmail: "logistic@sandaran.id",
    content:
      "Tambahan besi hollow 4x4 sebanyak 25 batang sudah dijadwalkan kirim besok pagi pukul 08.00 WITA.",
  },
  {
    id: "comment_sadara_2_b",
    reportId: "rep_sadara_2",
    userEmail: "executive@sandaran.id",
    content:
      "Terima kasih atas update-nya. Mohon prioritaskan area drop off begitu cuaca membaik.",
  },
  {
    id: "comment_ba_house_1_a",
    reportId: "rep_ba_house_1",
    userEmail: "admin@sandaran.id",
    content:
      "Laporan final diterima. BAST (Berita Acara Serah Terima) sudah disiapkan untuk klien.",
  },
];
