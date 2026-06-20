import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "bolao_session";

const publicPaths = ["/", "/login", "/cadastro"];
const authOnlyPaths = ["/alterar-senha"];

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function readSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const secret = getSecret();
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      role: payload.role as string,
      mustChangePassword: Boolean(payload.mustChangePassword),
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/webhooks")) {
    return NextResponse.next();
  }

  const session = await readSession(request);
  const isPublic = publicPaths.includes(pathname);
  const isAuthOnly = authOnlyPaths.includes(pathname);

  if (!session && !isPublic && !pathname.startsWith("/api/auth")) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session?.mustChangePassword) {
    const allowed =
      isAuthOnly ||
      pathname.startsWith("/api/auth/change-password") ||
      pathname.startsWith("/api/auth/logout");
    if (!allowed) {
      return NextResponse.redirect(new URL("/alterar-senha", request.url));
    }
  }

  if (session && !session.mustChangePassword) {
    if (isPublic && (pathname === "/login" || pathname === "/cadastro")) {
      const dest =
        session.role === "ADMIN" ? "/admin/jogos" : "/palpitar";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!session || session.role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const userRoutes = ["/perfil", "/palpites", "/palpitar", "/pagamento", "/resultados"];
  const userApiRoutes = ["/api/predictions", "/api/profile", "/api/games", "/api/results"];
  if (
    userRoutes.some((route) => pathname.startsWith(route)) ||
    userApiRoutes.some((route) => pathname.startsWith(route))
  ) {
    if (!session || session.role !== "USER") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/api/payments")) {
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
