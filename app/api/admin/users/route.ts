import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/guards";
import { ROLES, USER_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const users = await db.user.findMany({
      where: { role: ROLES.USER },
      include: {
        predictions: { where: { isPaid: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        status: u.status,
        betCount: u.predictions.length,
        betTotal: u.predictions.length,
      })),
    );
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = createSchema.parse(await request.json());

    const user = await db.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        phone: body.phone,
        passwordHash: await hashPassword(body.password ?? "123456"),
        role: ROLES.USER,
        status: body.status ?? USER_STATUS.ACTIVE,
        mustChangePassword: true,
      },
    });

    return NextResponse.json({ id: user.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 400 },
    );
  }
}
