import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { GAME_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  status: z.enum(["OPEN", "CLOSED", "FINISHED"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = updateSchema.parse(await request.json());

    if (body.isActive) {
      await db.game.updateMany({ where: { isActive: true }, data: { isActive: false } });
    }

    const game = await db.game.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(game);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await db.game.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 400 });
  }
}
