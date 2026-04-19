import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

import { upsertUserFromOAuth } from './lib/dal/user';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth;
    },
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        await upsertUserFromOAuth(user.email, user.name ?? undefined);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
  },
});
