import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { syncGameResult } from "@/lib/games/sync-result";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const result = await syncGameResult(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 400 },
    );
  }
}
