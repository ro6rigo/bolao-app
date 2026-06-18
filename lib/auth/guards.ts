import { ROLES, type Role } from "@/lib/constants";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  return db.user.findUnique({
    where: { id: session.userId },
  });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Não autenticado");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.role !== ROLES.ADMIN) {
    throw new Error("Acesso negado");
  }
  return session;
}

export async function requireUser() {
  const session = await requireSession();
  if (session.role !== ROLES.USER) {
    throw new Error("Acesso negado");
  }
  return session;
}
