import type { TransactionStatus, TransactionType } from "@prisma/client";

export interface DummyEmergencyTransaction {
  id: string;
  requestedByEmail: string;
  verifiedByEmail?: string;
  amount: number;
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  publicId?: string;
  url?: string;
  daysAgo: number;
}

export interface DummyEmergencyFund {
  id: string;
  projectId: string;
  /**
   * Dihitung konsisten dari transaksi REVIEWED:
   * sum(REVIEWED DEPOSIT) - sum(REVIEWED WITHDRAWAL)
   */
  currentBalance: number;
  transactions: DummyEmergencyTransaction[];
}

export const DUMMY_EMERGENCY_FUNDS: DummyEmergencyFund[] = [
  // --- Sadara Boutique Resort ---
  // Deposit reviewed: 15.000.000 | Withdrawal reviewed: 2.350.000 + 1.150.000 = 3.500.000
  // Saldo akhir: 11.500.000 (1 withdrawal 850.000 masih UNREVIEWED)
  {
    id: "fund_sadara_boutique",
    projectId: "proj_sadara_boutique",
    currentBalance: 11500000,
    transactions: [
      {
        id: "tx_em_sadara_1",
        requestedByEmail: "finance@sandaran.id",
        verifiedByEmail: "finance@sandaran.id",
        amount: 15000000,
        description:
          "Top-up saldo awal kas kecil operasional lapangan bulan berjalan",
        type: "DEPOSIT",
        status: "REVIEWED",
        daysAgo: 25,
      },
      {
        id: "tx_em_sadara_2",
        requestedByEmail: "supervisor@sandaran.id",
        verifiedByEmail: "finance@sandaran.id",
        amount: 2350000,
        description:
          "Pembelian mendadak semen instan tambahan dan sekrup gypsum untuk kejar target lobi",
        type: "WITHDRAWAL",
        status: "REVIEWED",
        publicId: "astaloka/sadara-boutique-resort/emergency/nota-semen-gypsum",
        url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
        daysAgo: 14,
      },
      {
        id: "tx_em_sadara_3",
        requestedByEmail: "supervisor@sandaran.id",
        verifiedByEmail: "finance@sandaran.id",
        amount: 1150000,
        description:
          "Biaya angkut puing bongkaran lobi dan konsumsi lembur tim MEP",
        type: "WITHDRAWAL",
        status: "REVIEWED",
        publicId: "astaloka/sadara-boutique-resort/emergency/nota-angkut-puing",
        url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
        daysAgo: 6,
      },
      {
        id: "tx_em_sadara_4",
        requestedByEmail: "supervisor@sandaran.id",
        amount: 850000,
        description:
          "Pembelian terpal pelindung area drop off karena hujan deras & sewa pompa air",
        type: "WITHDRAWAL",
        status: "UNREVIEWED",
        publicId: "astaloka/sadara-boutique-resort/emergency/nota-terpal-pompa",
        url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
        daysAgo: 1,
      },
    ],
  },

  // --- Sekar Tunjung House ---
  // Deposit reviewed: 10.000.000 | Withdrawal reviewed: 1.750.000
  // Saldo akhir: 8.250.000 (1 withdrawal 450.000 masih UNREVIEWED)
  {
    id: "fund_sekar_tunjung",
    projectId: "proj_sekar_tunjung",
    currentBalance: 8250000,
    transactions: [
      {
        id: "tx_em_sekar_1",
        requestedByEmail: "finance@sandaran.id",
        verifiedByEmail: "finance@sandaran.id",
        amount: 10000000,
        description:
          "Alokasi awal dana kas darurat proyek renovasi Sekar Tunjung",
        type: "DEPOSIT",
        status: "REVIEWED",
        daysAgo: 20,
      },
      {
        id: "tx_em_sekar_2",
        requestedByEmail: "supervisor@sandaran.id",
        verifiedByEmail: "finance@sandaran.id",
        amount: 1750000,
        description:
          "Pembelian lem kayu, amplas halus, dan komponen rel laci dry kitchen",
        type: "WITHDRAWAL",
        status: "REVIEWED",
        publicId:
          "astaloka/sekar-tunjung-house/emergency/nota-aksesoris-kitchen",
        url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
        daysAgo: 9,
      },
      {
        id: "tx_em_sekar_3",
        requestedByEmail: "supervisor@sandaran.id",
        amount: 450000,
        description: "Biaya pengiriman cepat profil list wainscoting tambahan",
        type: "WITHDRAWAL",
        status: "UNREVIEWED",
        daysAgo: 2,
      },
    ],
  },

  // --- B A House (DONE) ---
  // Deposit reviewed: 5.000.000 | Withdrawal reviewed: 4.800.000
  // Saldo akhir: 200.000
  {
    id: "fund_ba_house",
    projectId: "proj_ba_house",
    currentBalance: 200000,
    transactions: [
      {
        id: "tx_em_ba_1",
        requestedByEmail: "finance@sandaran.id",
        verifiedByEmail: "finance@sandaran.id",
        amount: 5000000,
        description: "Dana kas kecil tahap finishing & serah terima B A House",
        type: "DEPOSIT",
        status: "REVIEWED",
        daysAgo: 45,
      },
      {
        id: "tx_em_ba_2",
        requestedByEmail: "supervisor@sandaran.id",
        verifiedByEmail: "finance@sandaran.id",
        amount: 4800000,
        description:
          "Jasa general cleaning menyeluruh, touch-up cat, dan pembuangan sisa material",
        type: "WITHDRAWAL",
        status: "REVIEWED",
        publicId: "astaloka/b-a-house/emergency/nota-general-cleaning",
        url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
        daysAgo: 35,
      },
    ],
  },
];
