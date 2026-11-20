import type { DocumentType } from "@prisma/client";

export interface DummyProjectDocument {
  id: string;
  projectId: string;
  uploaderEmail: string;
  fileName: string;
  fileType: DocumentType;
  publicId: string;
  url: string;
  fileSize: number;
  mimeType: string;
  resourceType: string;
  title: string;
  description: string;
  version: string;
}

export const DUMMY_PROJECT_DOCUMENTS: DummyProjectDocument[] = [
  // --- Sadara Boutique Resort ---
  {
    id: "doc_sadara_1",
    projectId: "proj_sadara_boutique",
    uploaderEmail: "architect@sandaran.id",
    fileName: "DED-Lobi-Utama-RevB.pdf",
    fileType: "DRAWING",
    publicId: "astaloka/sadara-boutique-resort/documents/ded-lobi-utama-revb",
    url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    fileSize: 4250120,
    mimeType: "application/pdf",
    resourceType: "raw",
    title: "Gambar Kerja (DED) Lobi Utama",
    description:
      "Detail engineering drawing mencakup denah lantai, potongan plafon, dan titik lampu area lobi utama.",
    version: "Rev B",
  },
  {
    id: "doc_sadara_2",
    projectId: "proj_sadara_boutique",
    uploaderEmail: "architect@sandaran.id",
    fileName: "3D-Render-Villa-Suite.jpg",
    fileType: "DESIGN",
    publicId: "astaloka/sadara-boutique-resort/documents/3d-render-villa-suite",
    url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    fileSize: 1850400,
    mimeType: "image/jpeg",
    resourceType: "image",
    title: "Render 3D Interior Villa Suite",
    description:
      "Visualisasi konsep modern tropis Bali dengan aksen kayu jati dan anyaman rotan.",
    version: "v2.0",
  },
  {
    id: "doc_sadara_3",
    projectId: "proj_sadara_boutique",
    uploaderEmail: "architect@sandaran.id",
    fileName: "Spesifikasi-Material-Finishing.pdf",
    fileType: "SPECIFICATION",
    publicId:
      "astaloka/sadara-boutique-resort/documents/spec-material-finishing",
    url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    fileSize: 980300,
    mimeType: "application/pdf",
    resourceType: "raw",
    title: "Spesifikasi Material & Finishing",
    description:
      "Daftar kode cat, jenis batu alam, hardware pintu, dan spesifikasi pencahayaan.",
    version: "v1.1",
  },

  // --- Sekar Tunjung House ---
  {
    id: "doc_sekar_1",
    projectId: "proj_sekar_tunjung",
    uploaderEmail: "architect@sandaran.id",
    fileName: "Layout-Dry-Kitchen-Wainscoting.pdf",
    fileType: "DRAWING",
    publicId: "astaloka/sekar-tunjung-house/documents/layout-dry-kitchen",
    url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    fileSize: 3120450,
    mimeType: "application/pdf",
    resourceType: "raw",
    title: "Gambar Kerja Dry Kitchen & Wainscoting",
    description:
      "Detail ukuran kabinet dry kitchen dan pola profil dinding ruang keluarga.",
    version: "v1.0",
  },
  {
    id: "doc_sekar_2",
    projectId: "proj_sekar_tunjung",
    uploaderEmail: "architect@sandaran.id",
    fileName: "Moodboard-Modern-Classic.jpg",
    fileType: "REFERENCE",
    publicId: "astaloka/sekar-tunjung-house/documents/moodboard-modern-classic",
    url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    fileSize: 1240000,
    mimeType: "image/jpeg",
    resourceType: "image",
    title: "Referensi Moodboard Warna & Tekstur",
    description:
      "Palet warna netral hangat, contoh kain upholstery, dan referensi lampu gantung.",
    version: "v1.0",
  },

  // --- B A House ---
  {
    id: "doc_ba_1",
    projectId: "proj_ba_house",
    uploaderEmail: "architect@sandaran.id",
    fileName: "As-Built-Drawing-BA-House.pdf",
    fileType: "DRAWING",
    publicId: "astaloka/b-a-house/documents/as-built-drawing",
    url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    fileSize: 5410200,
    mimeType: "application/pdf",
    resourceType: "raw",
    title: "As-Built Drawing Final B A House",
    description:
      "Dokumen gambar terlaksana final termasuk jalur MEP untuk arsip serah terima klien.",
    version: "Final",
  },

  // --- Villa Jimbaran ---
  {
    id: "doc_jimbaran_1",
    projectId: "proj_villa_jimbaran",
    uploaderEmail: "architect@sandaran.id",
    fileName: "Konsep-Awal-Open-Plan-Living.pdf",
    fileType: "OTHER",
    publicId: "astaloka/villa-jimbaran/documents/konsep-awal-open-plan",
    url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    fileSize: 2150000,
    mimeType: "application/pdf",
    resourceType: "raw",
    title: "Proposal Konsep Awal & Estimasi Furnitur Custom",
    description:
      "Dokumen presentasi awal sebelum proyek dijeda sementara oleh pemilik.",
    version: "Draft 1",
  },
];
