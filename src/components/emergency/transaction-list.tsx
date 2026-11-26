"use client";

import {
  IconArrowBackUp,
  IconDotsVertical,
  IconEdit,
  IconPhoto,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/reui/badge";
import { DataGrid } from "~/components/reui/data-grid";
import {
  FilterBar,
  type FilterField,
  useDynamicFilters,
} from "~/components/reui/filters";
import { ConfirmDeleteDialog } from "~/components/shared/confirm-delete-dialog";
import { MediaPreview } from "~/components/shared/media-preview";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import {
  useDeleteEmergencyTransaction,
  useEmergencyTransactions,
} from "~/hooks/useEmergency";
import { DepositDialog } from "./deposit-dialog";
import {
  type EmergencyTransactionWithRelations,
  getEmergencyTransactionColumns,
} from "./transaction-columns";
import { VerifyDialog } from "./verify-dialog";
import { WithdrawDialog } from "./withdraw-dialog";

const EMERGENCY_FILTER_FIELDS: FilterField[] = [
  {
    id: "type",
    label: "Tipe Transaksi",
    options: [
      { label: "Deposit", value: "DEPOSIT" },
      { label: "Withdrawal", value: "WITHDRAWAL" },
    ],
  },
  {
    id: "status",
    label: "Status Tinjauan",
    options: [
      { label: "Menunggu Tinjauan", value: "UNREVIEWED" },
      { label: "Terverifikasi", value: "REVIEWED" },
    ],
  },
  {
    id: "amountRange",
    label: "Nominal",
    options: [
      { label: "< Rp 1.000.000", value: "under1m" },
      { label: "≥ Rp 1.000.000", value: "over1m" },
      { label: "≥ Rp 5.000.000", value: "over5m" },
    ],
  },
  {
    id: "hasProof",
    label: "Bukti Kwitansi",
    options: [
      { label: "Ada Bukti Foto", value: "yes" },
      { label: "Tanpa Bukti Foto", value: "no" },
    ],
  },
];

interface TransactionListProps {
  projectId: string;
  projectSlug: string;
  canReview: boolean;
  currentUserId?: string;
  isAdmin: boolean;
}

export function TransactionList({
  projectId,
  projectSlug,
  canReview,
  currentUserId,
  isAdmin,
}: TransactionListProps) {
  const {
    data: transactions,
    isLoading,
    isError,
    error,
    refetch,
  } = useEmergencyTransactions(projectId);
  const deleteTransaction = useDeleteEmergencyTransaction();
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyTarget, setVerifyTarget] = useState<{
    id: string;
    mode: "review" | "undo";
  } | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    description: string;
  } | null>(null);

  // Edit state for DEPOSIT
  const [editFund, setEditFund] = useState<{
    transactionId: string;
    amount: string;
    description: string;
    proofPublicId?: string;
    proofUrl?: string;
    isReviewed?: boolean;
  } | null>(null);

  // Edit state for WITHDRAWAL
  const [editWithdraw, setEditWithdraw] = useState<{
    transactionId: string;
    amount: string;
    description: string;
    proofPublicId?: string;
    proofUrl?: string;
    isReviewed?: boolean;
  } | null>(null);

  /**
   * Determine if the current user can edit/delete a given transaction
   */
  function canEditDelete(row: EmergencyTransactionWithRelations): boolean {
    // ADMIN can always edit/delete
    if (isAdmin) return true;

    // Owner check
    const isOwner = row.requestedById === currentUserId;
    if (!isOwner) return false;

    // WITHDRAWAL must be UNREVIEWED
    if (row.type === "WITHDRAWAL" && row.status !== "UNREVIEWED") return false;

    return true;
  }

  function handleEditClick(row: EmergencyTransactionWithRelations) {
    const isReviewed = row.status === "REVIEWED";
    const initialValues = {
      amount: String(Number(row.amount)),
      description: row.description,
      proofPublicId: row.publicId ?? undefined,
      proofUrl: row.url ?? undefined,
      isReviewed,
    };

    if (row.type === "DEPOSIT") {
      setEditFund({
        transactionId: row.id,
        ...initialValues,
      });
    } else {
      setEditWithdraw({
        transactionId: row.id,
        ...initialValues,
      });
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteTransaction.mutateAsync({
        projectId,
        transactionId: deleteTarget.id,
      });
      toast.success("Transaksi berhasil dihapus");
    } catch (error) {
      // Error toast is handled by global mutation cache
      console.error(error);
    } finally {
      setDeleteTarget(null);
    }
  }

  const { activeFilters, addFilter, removeFilter, resetFilters } =
    useDynamicFilters();

  const filteredTransactions = useMemo(() => {
    const raw = (transactions as EmergencyTransactionWithRelations[]) || [];
    if (activeFilters.length === 0) return raw;

    return raw.filter((tx) => {
      // 1. Tipe Transaksi
      const typeFilter = activeFilters.find((f) => f.field === "type");
      if (typeFilter && tx.type !== typeFilter.value) return false;

      // 2. Status Tinjauan
      const statusFilter = activeFilters.find((f) => f.field === "status");
      if (statusFilter && tx.status !== statusFilter.value) return false;

      // 3. Nominal
      const amountFilter = activeFilters.find((f) => f.field === "amountRange");
      if (amountFilter) {
        const amt = Number(tx.amount);
        if (amountFilter.value === "under1m" && amt >= 1_000_000) return false;
        if (amountFilter.value === "over1m" && amt < 1_000_000) return false;
        if (amountFilter.value === "over5m" && amt < 5_000_000) return false;
      }

      // 4. Bukti Foto
      const proofFilter = activeFilters.find((f) => f.field === "hasProof");
      if (proofFilter) {
        const hasProof = Boolean(tx.url || tx.publicId);
        if (proofFilter.value === "yes" && !hasProof) return false;
        if (proofFilter.value === "no" && hasProof) return false;
      }

      return true;
    });
  }, [transactions, activeFilters]);

  const mobileFilteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredTransactions;
    return filteredTransactions.filter((tx) =>
      tx.description.toLowerCase().includes(q),
    );
  }, [filteredTransactions, searchQuery]);

  const columns = getEmergencyTransactionColumns({
    canReview,
    canEditDelete,
    onVerify: setVerifyTarget,
    onEdit: handleEditClick,
    onDelete: setDeleteTarget,
    onPreviewImage: setLightboxImage,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full rounded-lg" />
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border p-8 text-center">
        <p className="text-sm font-medium text-destructive">
          Gagal memuat transaksi dana darurat
        </p>
        <p className="text-xs text-muted-foreground">
          {error?.message ?? "Terjadi kesalahan saat mengambil data."}
        </p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          <IconRefresh className="mr-1.5 size-3.5" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0 w-full">
      {/* ── Mobile (< md): Card View ─────────────────── */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex flex-col gap-2">
          <div className="relative flex items-center">
            <IconSearch className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              id="emergency-mobile-search"
              name="emergency-mobile-search"
              aria-label="Cari keterangan transaksi"
              placeholder="Cari keterangan transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 text-base"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 size-8"
                onClick={() => setSearchQuery("")}
                aria-label="Hapus pencarian"
              >
                <IconX className="size-4" />
              </Button>
            )}
          </div>
          <FilterBar
            fields={EMERGENCY_FILTER_FIELDS}
            activeFilters={activeFilters}
            onAddFilter={addFilter}
            onRemoveFilter={removeFilter}
            onResetFilters={resetFilters}
          />
        </div>

        {mobileFilteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Tidak ada transaksi ditemukan.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mobileFilteredTransactions.map((tx) => {
              const showReview = canReview && tx.status === "UNREVIEWED";
              const showUndoReview = canReview && tx.status === "REVIEWED";
              const showEditDelete = canEditDelete(tx);
              const isDeposit = tx.type === "DEPOSIT";

              return (
                <Card key={tx.id}>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium leading-snug">
                          {tx.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(tx.createdAt),
                            "dd MMM yyyy, HH:mm",
                            {
                              locale: idLocale,
                            },
                          )}
                        </p>
                      </div>

                      {(showEditDelete || showUndoReview) && (
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Aksi lainnya"
                            >
                              <IconDotsVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {showUndoReview && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setVerifyTarget({ id: tx.id, mode: "undo" })
                                }
                              >
                                <IconArrowBackUp className="mr-2 size-4" />
                                Batalkan Tinjauan
                              </DropdownMenuItem>
                            )}
                            {showEditDelete && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleEditClick(tx)}
                                >
                                  <IconEdit className="mr-2 size-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    setDeleteTarget({
                                      id: tx.id,
                                      description: tx.description,
                                    })
                                  }
                                >
                                  <IconTrash className="mr-2 size-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={isDeposit ? "default" : "secondary"}>
                          {isDeposit ? "Deposit" : "Withdrawal"}
                        </Badge>
                        <Badge
                          variant={
                            tx.status === "REVIEWED" ? "success" : "warning"
                          }
                        >
                          {tx.status === "REVIEWED"
                            ? "Terverifikasi"
                            : "Menunggu Tinjauan"}
                        </Badge>
                      </div>

                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          isDeposit
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {isDeposit ? "+" : "-"}
                        Rp {Number(tx.amount).toLocaleString("id-ID")}
                      </span>
                    </div>

                    {(tx.url || showReview) && (
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5">
                        {tx.url ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setLightboxImage(tx.url)}
                            className="gap-1.5"
                          >
                            <IconPhoto className="size-3.5" />
                            <span>Lihat Bukti</span>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Tanpa bukti
                          </span>
                        )}

                        {showReview && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              setVerifyTarget({ id: tx.id, mode: "review" })
                            }
                          >
                            Tinjau
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Desktop: DataGrid View ───────────────────── */}
      <div className="hidden md:block">
        <DataGrid
          columns={columns}
          data={filteredTransactions}
          filterColumn="description"
          filterPlaceholder="Cari keterangan transaksi..."
          toolbarActions={
            <FilterBar
              fields={EMERGENCY_FILTER_FIELDS}
              activeFilters={activeFilters}
              onAddFilter={addFilter}
              onRemoveFilter={removeFilter}
              onResetFilters={resetFilters}
            />
          }
          initialColumnPinning={{
            left: ["description"],
            right: ["actions"],
          }}
          exportFilename="transaksi-dana-darurat"
          csvColumns={[
            {
              header: "Tanggal",
              accessor: (row) =>
                format(new Date(row.createdAt), "yyyy-MM-dd HH:mm"),
            },
            { header: "Keterangan", accessor: (row) => row.description },
            {
              header: "Tipe",
              accessor: (row) =>
                row.type === "DEPOSIT" ? "Deposit" : "Withdrawal",
            },
            { header: "Jumlah (IDR)", accessor: (row) => Number(row.amount) },
            {
              header: "Status",
              accessor: (row) =>
                row.status === "REVIEWED"
                  ? "Terverifikasi"
                  : "Menunggu Tinjauan",
            },
            {
              header: "Pengaju",
              accessor: (row) => row.requester?.name ?? "-",
            },
          ]}
          emptyMessage="Tidak ada transaksi ditemukan."
        />
      </div>

      {/* Review / Undo Review Dialog */}
      <VerifyDialog
        projectId={projectId}
        transactionId={verifyTarget?.id ?? null}
        open={!!verifyTarget}
        onOpenChange={(open: boolean) => !open && setVerifyTarget(null)}
        mode={verifyTarget?.mode ?? "review"}
      />

      {/* Lightbox */}
      <MediaPreview
        url={lightboxImage}
        open={!!lightboxImage}
        onOpenChange={(open: boolean) => !open && setLightboxImage(null)}
      />

      {/* Delete Confirmation AlertDialog */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Transaksi"
        itemName={deleteTarget?.description}
        description={
          <>
            Apakah Anda yakin ingin menghapus transaksi{" "}
            <span className="inline-block max-w-50 align-bottom font-semibold truncate sm:max-w-70 text-foreground">
              &quot;{deleteTarget?.description}&quot;
            </span>
            ? Tindakan ini tidak dapat dibatalkan dan saldo akan disesuaikan.
          </>
        }
        onConfirm={handleDeleteConfirm}
        isPending={deleteTransaction.isPending}
      />

      {/* Edit Deposit Dialog */}
      <DepositDialog
        projectId={projectId}
        projectSlug={projectSlug}
        open={!!editFund}
        onOpenChange={(open: boolean) => !open && setEditFund(null)}
        mode="edit"
        transactionId={editFund?.transactionId}
        isReviewed={editFund?.isReviewed}
        initialValues={
          editFund
            ? {
                amount: editFund.amount,
                description: editFund.description,
                proofPublicId: editFund.proofPublicId,
                proofUrl: editFund.proofUrl,
              }
            : undefined
        }
      />

      {/* Edit Withdrawal Dialog */}
      <WithdrawDialog
        projectId={projectId}
        projectSlug={projectSlug}
        open={!!editWithdraw}
        onOpenChange={(open: boolean) => !open && setEditWithdraw(null)}
        mode="edit"
        transactionId={editWithdraw?.transactionId}
        isReviewed={editWithdraw?.isReviewed}
        initialValues={
          editWithdraw
            ? {
                amount: editWithdraw.amount,
                description: editWithdraw.description,
                proofPublicId: editWithdraw.proofPublicId,
                proofUrl: editWithdraw.proofUrl,
              }
            : undefined
        }
      />
    </div>
  );
}
