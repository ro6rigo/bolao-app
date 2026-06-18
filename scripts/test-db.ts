import { db } from "../lib/db";

async function main() {
  await db.$queryRaw`SELECT 1 as ok`;
  const count = await db.user.count();
  const admin = await db.user.findFirst({ where: { username: "ADMIN" } });
  console.log("Conexão OK");
  console.log("Usuários:", count);
  console.log("Admin:", admin ? "encontrado" : "NÃO encontrado — rode npm run db:seed");
}

main()
  .catch((error) => {
    console.error("Falha:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
