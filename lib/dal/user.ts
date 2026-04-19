import { prisma } from "@/lib/prisma";
import type { User } from "@/app/generated/prisma/client";

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function upsertUserFromOAuth(email: string, name?: string) {
  await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });
}
