import { prisma } from "@/lib/prisma";
import type { User, Topic } from "@/app/generated/prisma/client";

export async function createTopic(userId: User["id"], title: Topic["title"]) {
  return prisma.topic.create({
    data: { userId, title },
  });
}

export async function getTopicsWithLatestSession(userId: User["id"]) {
  const topics = await prisma.topic.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30, // placeholder
    include: {
      quizSessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true },
      },
    },
  });
  return topics
    .filter((topic) => topic.quizSessions.length > 0)
    .map(({ quizSessions, ...topic }) => ({
      ...topic,
      latestQuizSession: quizSessions[0],
    }));
}
