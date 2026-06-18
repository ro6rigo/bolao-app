import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
    const predictions = await db.prediction.findMany({
      include: {
        user: { select: { name: true, email: true } },
        game: { select: { homeTeam: true, awayTeam: true, matchDate: true } },
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(predictions);
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
}
