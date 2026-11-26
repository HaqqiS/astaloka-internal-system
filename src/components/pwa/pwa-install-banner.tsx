"use client";

import { IconDeviceMobile, IconDownload, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { usePwaInstall } from "~/hooks/use-pwa-install";
import { PwaInstallDialog } from "./pwa-install-dialog";

export function PwaInstallBanner() {
  const {
    canShowBanner,
    hasNativePrompt,
    isIos,
    promptInstall,
    dismissBanner,
  } = usePwaInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  if (!canShowBanner) {
    return null;
  }

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      const outcome = await promptInstall();
      if (outcome !== "unavailable") {
        return;
      }
    }
    setGuideOpen(true);
  };

  return (
    <>
      <Card size="sm">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
              <IconDeviceMobile className="size-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground">
                Pasang Astaloka di Layar Utama
              </p>
              <p className="text-xs text-muted-foreground">
                Buka sistem lapangan lebih cepat dalam tampilan layar penuh
                tanpa address bar browser.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
            <Button
              type="button"
              size="sm"
              onClick={() => void handleInstallClick()}
            >
              <IconDownload className="size-3.5" aria-hidden="true" />
              {isIos ? "Cara Pasang" : "Install Aplikasi"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={dismissBanner}
              aria-label="Tutup banner install aplikasi"
            >
              <IconX className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <PwaInstallDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        isIos={isIos}
      />
    </>
  );
}
