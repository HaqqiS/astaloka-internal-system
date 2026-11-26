"use client";

import {
  IconDeviceMobile,
  IconDotsVertical,
  IconShare2,
  IconSquarePlus,
} from "@tabler/icons-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface PwaInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isIos: boolean;
}

export function PwaInstallDialog({
  open,
  onOpenChange,
  isIos,
}: PwaInstallDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconDeviceMobile
              className="size-4 text-primary"
              aria-hidden="true"
            />
            Install Aplikasi Astaloka
          </DialogTitle>
          <DialogDescription>
            {isIos
              ? "Ikuti 2 langkah berikut di Safari untuk menambahkan Astaloka ke Layar Utama iPhone/iPad Anda."
              : "Tambahkan Astaloka ke Layar Utama untuk akses cepat layar penuh seperti aplikasi native."}
          </DialogDescription>
        </DialogHeader>

        {isIos ? (
          <ol className="flex flex-col gap-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground">
                1
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="font-medium text-foreground">
                  Ketuk tombol Share di Safari
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  Pilih ikon{" "}
                  <IconShare2
                    className="inline size-3.5 text-foreground"
                    aria-hidden="true"
                  />{" "}
                  pada bilah bawah browser Safari.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground">
                2
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="font-medium text-foreground">
                  Pilih &ldquo;Add to Home Screen&rdquo;
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  Gulir menu lalu ketuk{" "}
                  <IconSquarePlus
                    className="inline size-3.5 text-foreground"
                    aria-hidden="true"
                  />{" "}
                  <strong>Tambahkan ke Layar Utama</strong>, lalu ketuk{" "}
                  <strong>Tambah</strong>.
                </p>
              </div>
            </li>
          </ol>
        ) : (
          <ol className="flex flex-col gap-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground">
                1
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="font-medium text-foreground">
                  Buka menu browser (Chrome / Edge)
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  Ketuk ikon{" "}
                  <IconDotsVertical
                    className="inline size-3.5 text-foreground"
                    aria-hidden="true"
                  />{" "}
                  di pojok kanan atas browser Anda.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground">
                2
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="font-medium text-foreground">
                  Pilih &ldquo;Install app&rdquo; atau &ldquo;Add to Home
                  screen&rdquo;
                </p>
                <p className="text-xs text-muted-foreground">
                  Konfirmasi instalasi agar ikon Astaloka muncul di layar utama.
                </p>
              </div>
            </li>
          </ol>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Mengerti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
