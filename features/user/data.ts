import { prisma } from '@/lib/prisma';

// Upserts a user by email. Used by every auth provider (Google OAuth and the
// portfolio demo Credentials provider), so it is not OAuth-specific.
export const upsertUser = async (email: string, name?: string) => {
  await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });
};
