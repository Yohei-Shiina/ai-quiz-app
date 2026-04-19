"use server";

import { redirect } from "next/navigation";

import { Topic } from "@/app/generated/prisma/client";
import { requireAuth } from "@/features/auth/services";
import { validateTitleTopic } from "@/features/quiz/validations";
import { createQuizSession } from "@/lib/dal/quizSession";
import {
  createTopic,
  getTopicById,
  getTopicsWithLatestSession as getTopicsWithLatestSessionFromDB,
} from "@/lib/dal/topic";
import { ActionState } from "@/lib/types";

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

export async function getTopicsWithLatestSession() {
  const user = await requireAuth();
  return getTopicsWithLatestSessionFromDB(user.id);
}

export async function retryQuizWithNewSession(topicId: Topic["id"]) {
  const user = await requireAuth();
  const topic = await getTopicById(topicId);
  if (!topic || topic.userId !== user.id) throw new Error("Topic not found");
  const session = await createQuizSession(user.id, topicId);

  redirect(`/quiz/${session.id}`);
}
