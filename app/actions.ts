"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateTopicTitle } from "@/lib/validations/topic";

export type ActionState = { error: string | null };

export async function createQuizTopic(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Not authenticated");

  const title = formData.get("title");
  const error = validateTopicTitle(title);
  if (error) return { error };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("User not found");

  await prisma.topic.create({
    data: { userId: user.id, title: (title as string).trim() },
  });

  return { error: null };
}
