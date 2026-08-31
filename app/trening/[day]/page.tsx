import { notFound } from "next/navigation";
import { WorkoutScreen } from "@/components/workout-screen";
import type { DayId } from "@/lib/types";

function parseDay(value: string): DayId | null {
  const day = Number(value);
  if (day === 1 || day === 2 || day === 3 || day === 4) return day;
  return null;
}

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day } = await params;
  const dayId = parseDay(day);
  if (!dayId) notFound();
  return <WorkoutScreen dayId={dayId} />;
}
