import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SummaryScreen } from "@/components/summary-screen";
import { parseDayId } from "@/lib/plan";

export default async function SummaryPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day } = await params;
  const dayId = parseDayId(day);
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
