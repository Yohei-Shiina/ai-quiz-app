import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { type User } from "@/app/generated/prisma/client";

export async function requireAuth(): Promise<User> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("User not found");

  return user;
}
export async function getUser() {}
