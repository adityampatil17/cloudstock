import readline from "node:readline";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  const name = await ask("Admin name: ");
  const email = await ask("Admin email: ");
  const password = await ask("Admin password: ");

  if (!name || !email || !password) {
    console.log("All fields are required.");
    rl.close();
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    console.log("A user with this email already exists.");
    rl.close();
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("\nAdmin user created successfully!");
  console.log(`Name: ${user.name}`);
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);

  await prisma.$disconnect();
  rl.close();
}

main().catch(async (error) => {
  console.error("\nFailed to create admin:", error);

  await prisma.$disconnect();
  rl.close();

  process.exit(1);
});