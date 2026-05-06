import { cache } from 'react';

import { redirect } from 'next/navigation';

import { User } from '@/app/generated/prisma/client';
import { auth } from '@/auth';
import { ROUTES } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

// only used in requireAuth()
const getUserByEmail = async (email: User['email']) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const requireAuth = cache(async (): Promise<User> => {
  const session = await auth();
  if (!session?.user?.email) redirect(ROUTES.signIn);

  const user = await getUserByEmail(session.user.email);
  if (!user) redirect(ROUTES.signIn);

  return user;
});
