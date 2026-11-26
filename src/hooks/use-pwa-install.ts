"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

const DISMISS_STORAGE_KEY = "astaloka:pwa-banner-dismissed";

function detectIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

function detectIsIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isClassicIos = /iPad|iPhone|iPod/.test(ua);
  const isIpadOs =
    window.navigator.platform === "MacIntel" &&
    window.navigator.maxTouchPoints > 1;
  return isClassicIos || isIpadOs;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const standalone = detectIsStandalone();
    setIsStandalone(standalone);
    setIsIos(detectIsIos());

    try {
      setIsDismissed(window.localStorage.getItem(DISMISS_STORAGE_KEY) === "1");
    } catch {
      setIsDismissed(false);
    }

    setIsReady(true);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<
    "accepted" | "dismissed" | "unavailable"
  > => {
    if (!deferredPrompt) return "unavailable";
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }
    return outcome;
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    setIsDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
    } catch {
      // Ignore storage quota or privacy-mode errors
    }
  }, []);

  const hasNativePrompt = deferredPrompt !== null;
  const canShowBanner =
    isReady && !isStandalone && !isDismissed && (hasNativePrompt || isIos);
  const canShowMenuAction = isReady && !isStandalone;

  return {
    isReady,
    isStandalone,
    isIos,
    hasNativePrompt,
    canShowBanner,
    canShowMenuAction,
    promptInstall,
    dismissBanner,
  };
}
