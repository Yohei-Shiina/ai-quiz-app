import { randomUUID } from 'node:crypto';

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

import { DEMO_USER, ROUTES } from './lib/constants';

import { upsertUser } from '@/features/user/data';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    // Portfolio demo login: passwordless, one-click access. Each sign-in mints a
    // unique ephemeral user so concurrent visitors never share or interfere with
    // each other's topics and quiz sessions. Abuse is bounded not by credentials
    // but by demo-only quiz-generation limits (see lib/constants.ts / services).
    Credentials({
      authorize: async () => {
        const email = `${DEMO_USER.emailPrefix}${randomUUID()}@${DEMO_USER.emailDomain}`;
        return { id: email, email, name: DEMO_USER.name };
      },
    }),
  ],
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
        await upsertUser(user.email, user.name ?? undefined);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
  },
});
