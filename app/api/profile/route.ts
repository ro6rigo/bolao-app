import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { cpfSchema } from "@/lib/validations/cpf";

const schema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  cpf: cpfSchema.optional(),
});

export async function GET() {
  try {
    const session = await requireUser();
    const user = await db.user.findUnique({ where: { id: session.userId } });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireUser();
    const body = schema.parse(await request.json());

    if (body.cpf) {
      const existingCpf = await db.user.findFirst({
        where: { cpf: body.cpf, id: { not: session.userId } },
      });
      if (existingCpf) {
        return NextResponse.json({ error: "CPF já cadastrado" }, { status: 409 });
      }
    }

    const user = await db.user.update({
      where: { id: session.userId },
      data: body,
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 400 });
  }
}
