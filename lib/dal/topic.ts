import { prisma } from "@/lib/prisma";
import type { User, Topic } from "@/app/generated/prisma/client";

export async function createTopic(userId: User["id"], title: Topic["title"]) {
  return prisma.topic.create({
    data: { userId, title },
  });
}

export async function getTopicsByUserId(userId: User["id"]) {
  return prisma.topic.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" },
  });
}
