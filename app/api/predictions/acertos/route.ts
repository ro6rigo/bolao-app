import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireUser();
    const predictions = await db.prediction.findMany({
      where: { userId: session.userId, isPaid: true, isCorrect: true },
      include: { game: true },
      orderBy: { id: "desc" },
    });
    return NextResponse.json(predictions);
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
}
