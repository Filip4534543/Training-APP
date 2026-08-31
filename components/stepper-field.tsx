"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: number | null;
  step: number;
  min?: number;
  suffix: string;
  placeholder?: string;
  onChange: (value: number | null) => void;
};

export function StepperField({
  label,
  value,
  step,
  min = 0,
  suffix,
  placeholder,
  onChange,
}: Props) {
  function nudge(direction: -1 | 1) {
    const base = value ?? 0;
    const next = Math.round((base + direction * step) * 100) / 100;
    onChange(Math.max(min, next));
  }

  return (
    <label className="grid min-w-0 flex-1 gap-1.5">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          onClick={() => nudge(-1)}
          aria-label={`Zmniejsz ${label}`}
        >
          <Minus className="size-4" />
        </Button>
        <div className="relative min-w-0 flex-1">
          <Input
            inputMode="decimal"
            value={value ?? ""}
            placeholder={placeholder ?? "0"}
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
            className={cn(
              "h-11 pr-9 text-center font-heading text-xl tracking-wide tabular-nums",
            )}
          />
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          onClick={() => nudge(1)}
          aria-label={`Zwiększ ${label}`}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </label>
  );
}
