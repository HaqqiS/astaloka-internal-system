import type { LogisticType } from "@prisma/client";

export interface DummyLogisticTransaction {
  id: string;
  userEmail: string;
  type: LogisticType;
  quantity: number;
  notes: string;
  daysAgo: number;
}

export interface DummyLogisticItem {
  id: string;
  projectId: string;
  slug: string;
  name: string;
  unit: string;
  transactions: DummyLogisticTransaction[];
}

export const DUMMY_LOGISTIC_ITEMS: DummyLogisticItem[] = [
  // --- Sadara Boutique Resort ---
  {
    id: "log_item_sadara_semen",
    projectId: "proj_sadara_boutique",
    slug: "semen-instan-mu-301",
    name: "Semen Instan MU-301 (Plester)",
    unit: "Sak",
    transactions: [
      {
        id: "log_tx_sadara_semen_1",
        userEmail: "logistic@sandaran.id",
        type: "IN",
        quantity: 60,
        notes: "Pengiriman batch 1 dari supplier Depo Bangunan Denpasar",
        daysAgo: 12,
      },
      {
        id: "log_tx_sadara_semen_2",
        userEmail: "supervisor@sandaran.id",
        type: "OUT",
        quantity: 22,
        notes: "Dipakai untuk plesteran dinding area resepsionis lobi lantai 1",
        daysAgo: 5,
      },
      {
        id: "log_tx_sadara_semen_3",
        userEmail: "supervisor@sandaran.id",
        type: "OUT",
        quantity: 14,
        notes: "Lanjutan plesteran dinding lobi utama & koridor",
        daysAgo: 2,
      },
    ],
  },
  {
    id: "log_item_sadara_hollow",
    projectId: "proj_sadara_boutique",
    slug: "besi-hollow-galvalum-4x4",
    name: "Besi Hollow Galvalum 4x4",
    unit: "Batang",
    transactions: [
      {
        id: "log_tx_sadara_hollow_1",
        userEmail: "logistic@sandaran.id",
        type: "IN",
        quantity: 50,
        notes: "Stok awal rangka plafon lobi utama",
        daysAgo: 10,
      },
      {
        id: "log_tx_sadara_hollow_2",
        userEmail: "supervisor@sandaran.id",
        type: "OUT",
        quantity: 35,
        notes: "Pemasangan rangka plafon area lobi & drop off",
        daysAgo: 3,
      },
    ],
  },
  {
    id: "log_item_sadara_kabel",
    projectId: "proj_sadara_boutique",
    slug: "kabel-nym-3x2-5-supreme",
    name: "Kabel NYM 3x2.5mm Supreme",
    unit: "Roll",
    transactions: [
      {
        id: "log_tx_sadara_kabel_1",
        userEmail: "logistic@sandaran.id",
        type: "IN",
        quantity: 10,
        notes: "Pengadaan material elektrikal lobi & suite",
        daysAgo: 15,
      },
      {
        id: "log_tx_sadara_kabel_2",
        userEmail: "supervisor@sandaran.id",
        type: "OUT",
        quantity: 4,
        notes: "Instalasi jalur lampu ceiling lobi utama",
        daysAgo: 4,
      },
    ],
  },

  // --- Sekar Tunjung House ---
  {
    id: "log_item_sekar_wainscoting",
    projectId: "proj_sekar_tunjung",
    slug: "profil-wainscoting-pvc-4cm",
    name: "Profil List Wainscoting PVC 4cm",
    unit: "Batang",
    transactions: [
      {
        id: "log_tx_sekar_wains_1",
        userEmail: "logistic@sandaran.id",
        type: "IN",
        quantity: 80,
        notes:
          "Pengiriman material profil dinding ruang keluarga & kamar utama",
        daysAgo: 11,
      },
      {
        id: "log_tx_sekar_wains_2",
        userEmail: "supervisor@sandaran.id",
        type: "OUT",
        quantity: 28,
        notes: "Pemasangan dinding utama ruang keluarga",
        daysAgo: 4,
      },
    ],
  },
  {
    id: "log_item_sekar_multiplek",
    projectId: "proj_sekar_tunjung",
    slug: "multiplek-meranti-18mm",
    name: "Multiplek Meranti 18mm",
    unit: "Lembar",
    transactions: [
      {
        id: "log_tx_sekar_mult_1",
        userEmail: "logistic@sandaran.id",
        type: "IN",
        quantity: 30,
        notes: "Bahan baku kabinet dry kitchen dan lemari built-in",
        daysAgo: 14,
      },
      {
        id: "log_tx_sekar_mult_2",
        userEmail: "supervisor@sandaran.id",
        type: "OUT",
        quantity: 12,
        notes: "Pemotongan rangka kabinet bawah dry kitchen",
        daysAgo: 6,
      },
    ],
  },

  // --- B A House ---
  {
    id: "log_item_ba_cat",
    projectId: "proj_ba_house",
    slug: "cat-interior-jotun-majestic-20l",
    name: "Cat Interior Jotun Majestic (Warm White)",
    unit: "Pail",
    transactions: [
      {
        id: "log_tx_ba_cat_1",
        userEmail: "logistic@sandaran.id",
        type: "IN",
        quantity: 8,
        notes: "Pengadaan cat finishing interior 2 lantai",
        daysAgo: 40,
      },
      {
        id: "log_tx_ba_cat_2",
        userEmail: "supervisor@sandaran.id",
        type: "OUT",
        quantity: 7,
        notes:
          "Pengecatan final & touch-up seluruh ruangan (sisa 1 pail untuk cadangan klien)",
        daysAgo: 32,
      },
    ],
  },
];
