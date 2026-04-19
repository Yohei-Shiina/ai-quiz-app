import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getUserByEmail } from "@/lib/dal/user";
import type { User } from "@/app/generated/prisma/client";

export async function requireAuth(): Promise<User> {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await getUserByEmail(session.user.email);
  if (!user) redirect("/login");

  return user;
}
