import "./load-env";
import { db } from "../lib/db";
import bcrypt from "bcryptjs";
import { ROLES, USER_STATUS } from "../lib/constants";

const prisma = db;

async function main() {
  const adminPassword = await bcrypt.hash("456SENHA123", 10);

  await prisma.user.upsert({
    where: { username: "ADMIN" },
    update: {
      passwordHash: adminPassword,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      mustChangePassword: false,
    },
    create: {
      name: "Administrador",
      email: "admin@bolao.local",
      username: "ADMIN",
      passwordHash: adminPassword,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      mustChangePassword: false,
    },
  });

  console.log("Seed: admin ADMIN / 456SENHA123 criado.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
