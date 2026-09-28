"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useAppState } from "@/components/app-state-provider";
import { LineChart } from "@/components/line-chart";
import { StepperField } from "@/components/stepper-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatDateTime,
  formatKg,
  formatShortDate,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/format";
import type { Profile } from "@/lib/types";

export function WeightScreen() {
  const { profile, logWeight, removeWeight, status } = useAppState();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-4 sm:py-6">
      <header>
        <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
          {profile.name}
        </p>
        <h1 className="font-heading text-3xl tracking-wide uppercase sm:text-4xl">Waga</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Możesz zapisać pomiar kilka razy dziennie. Data i godzina ustawiają się same.
        </p>
      </header>

      {status === "loading" ? (
        <p className="text-sm text-muted-foreground">Wczytuję pomiary…</p>
      ) : (
        <WeightBody
          key={profile.id}
          profile={profile}
          logWeight={logWeight}
          removeWeight={removeWeight}
        />
      )}
    </div>
  );
}

function WeightBody({
  profile,
  logWeight,
  removeWeight,
}: {
  profile: Profile;
  logWeight: (weight: number, recordedAt?: string) => void;
  removeWeight: (entryId: string) => void;
}) {
  const latest = profile.bodyWeights.at(-1);
  const [weight, setWeight] = useState<number | null>(latest?.weight ?? null);
  const [recordedAt, setRecordedAt] = useState(toDatetimeLocalValue);

  const points = useMemo(
    () =>
      profile.bodyWeights.map((entry) => ({
        label: formatShortDate(entry.recordedAt),
        value: entry.weight,
        caption: new Intl.DateTimeFormat("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(entry.recordedAt)),
      })),
    [profile.bodyWeights],
  );

  const entries = [...profile.bodyWeights].reverse();

  function submit() {
    if (weight == null || weight <= 0) return;
    logWeight(weight, fromDatetimeLocalValue(recordedAt));
    setRecordedAt(toDatetimeLocalValue());
  }

  return (
    <>
      <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
          Aktualna
        </p>
        <p className="font-heading text-4xl tracking-wide">
          {latest ? `${formatKg(latest.weight)} kg` : "—"}
        </p>
        {latest ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateTime(latest.recordedAt)}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Jeszcze bez pomiarów.</p>
        )}

        <form
          className="mt-4 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <StepperField
            label="Waga ciała"
            value={weight}
            step={0.1}
            suffix="kg"
            placeholder={latest ? formatKg(latest.weight) : "0"}
            onChange={setWeight}
          />
          <label className="grid gap-1">
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Data i godzina
            </span>
            <Input
              type="datetime-local"
              value={recordedAt}
              onChange={(event) => setRecordedAt(event.target.value)}
              className="h-11"
            />
          </label>
          <Button type="submit" className="h-12" disabled={weight == null || weight <= 0}>
            Zapisz pomiar
          </Button>
        </form>
      </section>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="font-heading text-xl tracking-wide uppercase">Wahania</h2>
        <LineChart className="mt-3" points={points} unit="kg" />
      </section>

      {entries.length > 0 ? (
        <section className="grid gap-2">
          <h2 className="font-heading text-lg tracking-wide uppercase">Pomiary</h2>
          <ul className="grid gap-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-card px-3 py-3 ring-1 ring-foreground/10"
              >
                <div>
                  <p className="font-heading text-lg tracking-wide">
                    {formatKg(entry.weight)} kg
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(entry.recordedAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 text-destructive hover:text-destructive"
                  aria-label="Usuń pomiar"
                  onClick={() => {
                    if (window.confirm("Usunąć ten pomiar wagi?")) {
                      removeWeight(entry.id);
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
