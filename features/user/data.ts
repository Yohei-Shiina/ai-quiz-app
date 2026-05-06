import { prisma } from '@/lib/prisma';

export const upsertUserFromOAuth = async (email: string, name?: string) => {
  await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });
};
