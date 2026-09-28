"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  label: string;
  value: number | null;
  step: number;
  min?: number;
  suffix: string;
  placeholder?: string;
  lastValue?: string | null;
  onChange: (value: number | null) => void;
};

export function StepperField({
  label,
  value,
  step,
  min = 0,
  suffix,
  placeholder,
  lastValue,
  onChange,
}: Props) {
  function nudge(direction: -1 | 1) {
    const base = value ?? 0;
    const next = Math.round((base + direction * step) * 100) / 100;
    onChange(Math.max(min, next));
  }

  return (
    <label className="grid min-w-0 flex-1 gap-0.5">
      <span className="sr-only">{label}</span>
      <div className="flex min-w-0 items-center">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-r-none sm:size-11"
          onClick={() => nudge(-1)}
          aria-label={`Zmniejsz ${label}`}
        >
          <Minus className="size-4" />
        </Button>
        <div className="relative min-w-0 flex-1">
          <Input
            inputMode="decimal"
            value={value ?? ""}
            placeholder={placeholder ?? lastValue ?? "0"}
            onChange={(event) => {
              const raw = event.target.value.replace(",", ".");
              if (raw === "") {
                onChange(null);
                return;
              }
              const parsed = Number(raw);
              if (Number.isNaN(parsed)) return;
              onChange(parsed);
            }}
            className="h-10 rounded-none border-x-0 px-1 pr-6 text-center font-heading text-lg tracking-wide tabular-nums sm:h-11 sm:text-xl"
          />
          <span className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-[10px] text-muted-foreground sm:right-2 sm:text-xs">
            {suffix}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-l-none sm:size-11"
          onClick={() => nudge(1)}
          aria-label={`Zwiększ ${label}`}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {lastValue ? (
        <span className="text-center text-[10px] font-medium tracking-wide text-muted-foreground">
          ost. {lastValue}
        </span>
      ) : null}
    </label>
  );
}
