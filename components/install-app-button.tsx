"use client";

import { Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

export function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (isStandaloneDisplay()) return;

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    function onAppInstalled() {
      setInstallEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installEvent) return;

    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") setInstallEvent(null);
  }, [installEvent]);

  if (!installEvent) return null;

  return (
    <Button
      type="button"
      variant="outline"
      aria-label="Pobierz aplikację"
      onClick={() => void install()}
      className="hidden h-10 rounded-full px-3 sm:inline-flex"
    >
      <Download className="size-4" />
      <span className="hidden md:inline">Pobierz aplikację</span>
    </Button>
  );
}
