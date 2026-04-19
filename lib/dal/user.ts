import { cache } from 'react';

import type { User } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export const getUserByEmail = cache(async (email: User['email']) => {
  return prisma.user.findUnique({
    where: { email },
  });
});

export async function upsertUserFromOAuth(email: string, name?: string) {
  await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });
}
