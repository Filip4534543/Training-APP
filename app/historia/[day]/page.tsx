import { HistoryDayScreen } from "@/components/history-day-screen";
import { parseDayId } from "@/lib/plan";
import { notFound } from "next/navigation";

export default async function HistoriaDayPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day } = await params;
  const dayId = parseDayId(day);
  if (!dayId) notFound();
  return <HistoryDayScreen dayId={dayId} />;
}
