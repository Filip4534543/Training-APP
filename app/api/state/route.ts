import { NextResponse } from "next/server";
import { loadState, saveState } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const payload = await loadState();
    return NextResponse.json(payload);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nie udało się wczytać stanu treningów." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const payload = await saveState(body.state ?? body);
    return NextResponse.json(payload);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nie udało się zapisać treningu." },
      { status: 500 },
    );
  }
}
