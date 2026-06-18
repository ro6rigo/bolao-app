import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { ROLES, USER_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";

const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const login = body.login.trim();

    const user = await db.user.findFirst({
      where: {
        OR: [{ email: login.toLowerCase() }, { username: login.toUpperCase() }],
      },
    });

    if (!user || user.status === USER_STATUS.INACTIVE) {
      return NextResponse.json(
        { error: "Credenciais inválidas ou usuário inativo" },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    await createSession({
      userId: user.id,
      role: user.role as "ADMIN" | "USER",
      mustChangePassword: user.mustChangePassword,
    });

    return NextResponse.json({
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("Erro no login:", error);

    const message = error instanceof Error ? error.message : "";
    if (message.includes("Can't reach database") || message.includes("P1001")) {
      return NextResponse.json(
        {
          error:
            "Banco de dados indisponível. Verifique DATABASE_URL e DIRECT_URL no Neon.",
        },
        { status: 503 },
      );
    }
    if (message.includes("does not exist") || message.includes("P2021")) {
      return NextResponse.json(
        {
          error:
            "Tabelas não criadas. Rode: npm run db:setup",
        },
        { status: 503 },
      );
    }
    if (message === "AUTH_SECRET não configurado") {
      return NextResponse.json(
        { error: "AUTH_SECRET não configurado no servidor" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao autenticar" },
      { status: 500 },
    );
  }
}
