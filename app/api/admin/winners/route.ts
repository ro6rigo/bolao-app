import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");

    if (!gameId) {
      return NextResponse.json({ error: "gameId obrigatório" }, { status: 400 });
    }

    const winners = await db.prediction.findMany({
      where: { gameId, isPaid: true, isCorrect: true },
      include: { user: { select: { name: true, email: true, phone: true } } },
    });

    return NextResponse.json(winners);
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
}
