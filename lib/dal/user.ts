import { prisma } from "@/lib/prisma";
import type { User } from "@/app/generated/prisma/client";

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({
    where: { email },
  });
}
