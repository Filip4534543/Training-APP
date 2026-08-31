import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SummaryScreen } from "@/components/summary-screen";
import type { DayId } from "@/lib/types";

function parseDay(value: string): DayId | null {
  const day = Number(value);
  if (day === 1 || day === 2 || day === 3 || day === 4) return day;
  return null;
}

export default async function SummaryPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day } = await params;
  const dayId = parseDay(day);
  if (!dayId) notFound();
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Liczę progres…
        </div>
      }
    >
      <SummaryScreen dayId={dayId} />
    </Suspense>
  );
}
