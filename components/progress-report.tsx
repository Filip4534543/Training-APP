import { ArrowDownRight, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { formatDate, formatKg, formatVolume, signed } from "@/lib/format";
import type { BestSet, ExerciseProgress, ExerciseTrend, WorkoutProgress } from "@/lib/types";
import { cn } from "@/lib/utils";

const TREND: Record<
  ExerciseTrend,
  { label: string; className: string; icon: typeof ArrowUpRight }
> = {
  up: {
    label: "Lepszy wynik",
    className: "text-emerald-700 dark:text-emerald-300",
    icon: ArrowUpRight,
  },
  down: {
    label: "Słabszy wynik",
    className: "text-rose-700 dark:text-rose-300",
    icon: ArrowDownRight,
  },
  same: {
    label: "Bez zmian",
    className: "text-muted-foreground",
    icon: ArrowRight,
  },
  new: {
    label: "Nowe ćwiczenie",
    className: "text-amber-800 dark:text-amber-300",
    icon: Sparkles,
  },
};

function BestLine({
  label,
  best,
}: {
  label: string;
  best: BestSet | null;
}) {
  return (
    <p className="text-xs text-muted-foreground">
      {label}:{" "}
      {best ? (
        <span className="text-foreground">
          {best.repsLeft != null || best.repsRight != null
            ? `${formatKg(best.weight)} kg × L ${best.repsLeft ?? "—"} / P ${best.repsRight ?? "—"}`
            : `${formatKg(best.weight)} kg × ${best.reps}`}
        </span>
      ) : (
        "brak"
      )}
    </p>
  );
}

export function ProgressReport({ progress }: { progress: WorkoutProgress }) {
  return (
    <div className="grid gap-4">
      <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
          Porównanie z poprzednim dniem tego planu
        </p>
        {progress.previousDate ? (
          <h2 className="mt-1 font-heading text-xl tracking-wide uppercase sm:text-2xl">
            vs {formatDate(progress.previousDate)}
          </h2>
        ) : (
          <h2 className="mt-1 font-heading text-xl tracking-wide uppercase sm:text-2xl">
            Pierwszy raz ten dzień
          </h2>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {progress.previousDate
            ? "Objętość (ciężar × powtórzenia) względem ostatniego ukończonego treningu tego samego dnia."
            : "Nie ma jeszcze wcześniejszego treningu tego dnia, więc to punkt startowy."}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Lepsze" value={progress.improved} />
          <Stat label="Słabsze" value={progress.declined} />
          <Stat label="Bez zmian" value={progress.unchanged} />
          <Stat label="Nowe" value={progress.fresh} />
        </dl>
        {progress.totalVolumeDelta !== null ? (
          <p className="mt-4 font-heading text-3xl tracking-wide">
            {signed(Math.round(progress.totalVolumeDelta), " kg")}{" "}
            <span className="text-base text-muted-foreground">objętości</span>
          </p>
        ) : null}
      </section>

      <div className="grid gap-3">
        {progress.exercises.map((item) => (
          <ExerciseProgressCard key={item.slotId} item={item} />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/70 px-3 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="font-heading text-2xl leading-none">{value}</dd>
    </div>
  );
}

function ExerciseProgressCard({ item }: { item: ExerciseProgress }) {
  const meta = TREND[item.trend];
  const Icon = meta.icon;

  return (
    <article className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-heading text-base leading-tight tracking-wide uppercase sm:text-lg">
          {item.name}
        </h3>
        <span className={cn("inline-flex shrink-0 items-center gap-1 text-[11px] font-medium sm:text-xs", meta.className)}>
          <Icon className="size-3.5" />
          {meta.label}
        </span>
      </div>
      {item.trend === "new" ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Ćwiczenie było zmieniane albo nie pojawiło się w poprzednim dniu — liczymy od nowa.
        </p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <BestLine label="Dziś najlepsza seria" best={item.currentBest} />
          <BestLine label="Poprzednio" best={item.previousBest} />
          <p className="text-xs text-muted-foreground">
            Objętość:{" "}
            <span className="text-foreground">{formatVolume(item.currentVolume)}</span>
            {item.volumeDelta !== null ? (
              <span> ({signed(Math.round(item.volumeDelta), " kg")})</span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">
            Serie: {item.currentSets}
            {item.previousSets !== null ? ` vs ${item.previousSets}` : ""}
          </p>
        </div>
      )}
    </article>
  );
}
