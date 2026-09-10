import { notFound } from "next/navigation";
import { WorkoutScreen } from "@/components/workout-screen";
import { parseDayId } from "@/lib/plan";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day } = await params;
  const dayId = parseDayId(day);
  if (!dayId) notFound();
  return <WorkoutScreen dayId={dayId} />;
}
