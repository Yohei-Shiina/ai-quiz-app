import { redirect } from 'next/navigation';

import type { User } from '@/app/generated/prisma/client';
import { auth } from '@/auth';
import { getUserByEmail } from '@/lib/dal/user';

export const requireAuth = async (): Promise<User> => {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await getUserByEmail(session.user.email);
  if (!user) redirect('/login');

  return user;
};
