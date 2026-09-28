"use client";

import { useState } from "react";
import { PatternPad } from "@/components/pattern-pad";
import { Logo } from "@/components/logo";
import { hashPattern, MIN_PATTERN_LENGTH } from "@/lib/pattern";
import type { Profile, ProfileId } from "@/lib/types";
import { cn } from "@/lib/utils";

type Mode = "unlock" | "create" | "confirm";

type Props = {
  profiles: Profile[];
  selectedId: ProfileId;
  onSelect: (id: ProfileId) => void;
  onUnlocked: (id: ProfileId) => void;
  onSetPattern: (id: ProfileId, hash: string) => Promise<void> | void;
};

export function LockScreen({ profiles, selectedId, onSelect, onUnlocked, onSetPattern }: Props) {
  const selected = profiles.find((item) => item.id === selectedId) ?? profiles[0]!;
  const needsSetup = !selected.patternHash;
  const [mode, setMode] = useState<Mode>(needsSetup ? "create" : "unlock");
  const [draft, setDraft] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const title = needsSetup
    ? mode === "confirm"
      ? "Powtórz wzór"
      : "Ustaw wzór"
    : "Narysuj wzór";

  async function handleComplete(path: number[]) {
    if (busy) return;
    if (path.length < MIN_PATTERN_LENGTH) {
      setError("Wzór musi łączyć minimum 4 kropki.");
      return;
    }

    if (needsSetup || mode === "create" || mode === "confirm") {
      if (mode === "create" || (needsSetup && mode !== "confirm")) {
        setDraft(path);
        setMode("confirm");
        setError(null);
        return;
      }
      if (path.join("-") !== draft.join("-")) {
        setError("Wzory się nie zgadzają. Spróbuj od nowa.");
        setDraft([]);
        setMode("create");
        return;
      }
      setBusy(true);
      try {
        const hash = await hashPattern(path);
        await onSetPattern(selected.id, hash);
        onUnlocked(selected.id);
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      const hash = await hashPattern(path);
      if (hash !== selected.patternHash) {
        setError("Zły wzór. Spróbuj jeszcze raz.");
        return;
      }
      setError(null);
      onUnlocked(selected.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <Logo />
      <div className="w-full max-w-sm text-center">
        <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Wejście
        </p>
        <h1 className="font-heading text-3xl tracking-wide uppercase">Wybierz profil</h1>
      </div>

      <div className="flex rounded-full bg-muted p-1">
        {profiles.map((item) => {
          const active = item.id === selected.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item.id);
                setDraft([]);
                setError(null);
                setMode(item.patternHash ? "unlock" : "create");
              }}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium",
                active ? "bg-foreground text-background" : "text-muted-foreground",
              )}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      <div className="w-full max-w-sm text-center">
        <h2 className="font-heading text-xl tracking-wide uppercase">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {needsSetup
            ? `Ustaw 9-punktowy wzór dla profilu ${selected.name}, jak na Androidzie.`
            : `Profil ${selected.name} jest zablokowany wzorem.`}
        </p>
      </div>

      <PatternPad error={Boolean(error)} disabled={busy} onComplete={(path) => void handleComplete(path)} />

      {error ? <p className="text-sm text-destructive">{error}</p> : <p className="h-5" />}
    </div>
  );
}
