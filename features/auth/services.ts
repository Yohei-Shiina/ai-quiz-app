import { auth } from "@/auth";
import { getUserByEmail } from "@/lib/dal/user";
import type { User } from "@/app/generated/prisma/client";

export async function requireAuth(): Promise<User> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Not authenticated");

  const user = await getUserByEmail(session.user.email);
  if (!user) throw new Error("User not found");

  return user;
}
