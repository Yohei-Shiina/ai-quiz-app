import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

import { ROUTES } from './lib/constants';
import { upsertUserFromOAuth } from './lib/dal/user';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    signIn: ROUTES.signIn,
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoginPage = request.nextUrl.pathname === ROUTES.signIn;
      if (auth && isLoginPage) {
        return Response.redirect(new URL('/', request.nextUrl));
      }
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
