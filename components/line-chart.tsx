"use client";

import { formatKg } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ChartPoint = {
  label: string;
  value: number;
  caption?: string;
};

type Props = {
  points: ChartPoint[];
  unit?: string;
  className?: string;
};

export function LineChart({ points, unit = "kg", className }: Props) {
  const visible = points.length > 8 ? points.slice(-8) : points;

  if (visible.length === 0) {
    return (
      <div
        className={cn(
          "flex h-36 items-center justify-center rounded-xl bg-muted/50 text-sm text-muted-foreground",
          className,
        )}
      >
        Brak punktów do wykresu
      </div>
    );
  }

  const width = 320;
  const height = 160;
  const padX = 12;
  const padY = 18;
  const values = visible.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.max(Math.abs(max) * 0.08, 1);
  const low = min - span * 0.18;
  const high = max + span * 0.18;
  const range = high - low;

  const coords = visible.map((point, index) => {
    const x =
      visible.length === 1
        ? width / 2
        : padX + (index / (visible.length - 1)) * (width - padX * 2);
    const y = padY + ((high - point.value) / range) * (height - padY * 2);
    return { ...point, x, y };
  });

  const line = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${coords[coords.length - 1].x} ${height - 4} L ${coords[0].x} ${height - 4} Z`;

  return (
    <div className={cn("grid gap-2", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full text-foreground" role="img">
        <path d={area} fill="currentColor" className="opacity-10" />
        <path d={line} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        {coords.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={point.x} cy={point.y} r="3.5" className="fill-background stroke-foreground" strokeWidth="2" />
          </g>
        ))}
      </svg>
      <div className="flex justify-between gap-2 overflow-hidden">
        {coords.map((point, index) => (
          <div key={`${point.label}-${index}`} className="min-w-0 flex-1 text-center">
            <p className="truncate font-heading text-xs tabular-nums">
              {formatKg(point.value)} {unit}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">{point.label}</p>
            {point.caption ? (
              <p className="truncate text-[10px] text-muted-foreground">{point.caption}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
