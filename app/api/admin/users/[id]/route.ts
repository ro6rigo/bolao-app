import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/guards";
import { USER_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = updateSchema.parse(await request.json());

    const data: Record<string, unknown> = { ...body };
    if (body.password) {
      data.passwordHash = await hashPassword(body.password);
      delete data.password;
    }
    if (body.email) {
      data.email = body.email.toLowerCase();
    }

    const user = await db.user.update({ where: { id }, data });
    return NextResponse.json(user);
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
    await db.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 400 });
  }
}
