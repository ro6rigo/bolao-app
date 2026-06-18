import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { ROLES, USER_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z
    .string()
    .optional()
    .nullable()
    .transform((value) => value?.trim() || undefined),
});

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const email = body.email.toLowerCase();

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
    }

    const passwordHash = await hashPassword("123456");

    const user = await db.user.create({
      data: {
        name: body.name,
        email,
        phone: body.phone,
        passwordHash,
        role: ROLES.USER,
        status: USER_STATUS.ACTIVE,
        mustChangePassword: true,
      },
    });

    await createSession({
      userId: user.id,
      role: ROLES.USER,
      mustChangePassword: true,
    });

    return NextResponse.json({ mustChangePassword: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("Erro no cadastro:", error);
    return NextResponse.json(
      { error: "Erro interno ao cadastrar" },
      { status: 500 },
    );
  }
}
