"use server";

import { prisma } from "@/lib/prisma";
import { validateTitleTopic } from "@/features/quiz/validations";
import { redirect } from "next/navigation";
import { ActionState } from "@/lib/types";
import { requireAuth } from "@/features/auth/service";
import { createQuizSession, createTopic } from "@/features/quiz/services";

export async function createQuizTopic(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAuth();

  const result = validateTitleTopic(formData);
  if (result.error) {
    return { error: result.error };
  }

  const topic = await createTopic(user.id, result.data!.title);
  const session = await createQuizSession(user.id, topic.id);

  redirect(`/quiz/${session.id}`);
}

export async function getQuizTopics() {
  const user = await requireAuth();

  const topics = await prisma.topic.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return topics;
}
