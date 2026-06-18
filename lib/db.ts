import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

/**
 * Neon + Prisma (serverless driver via WebSocket).
 * @see https://neon.com/docs/connect/connect-from-any-app
 * @see https://neon.com/docs/guides/prisma
 *
 * DATABASE_URL = pooled (-pooler) para a aplicação
 * DIRECT_URL   = direct para prisma migrate deploy
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  const log =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  if (connectionString?.includes("neon.tech")) {
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter, log: log as ("error" | "warn")[] });
  }

  return new PrismaClient({ log: log as ("error" | "warn")[] });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
