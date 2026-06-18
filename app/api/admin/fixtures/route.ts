import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import {
  fetchBrazilMatches,
  normalizeMatch,
} from "@/lib/football-data/client";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const season = Number(searchParams.get("season") ?? new Date().getFullYear());

    const matches = await fetchBrazilMatches(season);
    return NextResponse.json(matches.map(normalizeMatch));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 500 },
    );
  }
}
