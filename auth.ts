import { randomUUID } from 'node:crypto';

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { z } from 'zod';

import { DEMO_USER, ROUTES } from './lib/constants';

import { upsertUser } from '@/features/user/data';

const demoCredentialsSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    // Portfolio demo login: a single shared ID/password gates access, but each
    // successful sign-in mints a unique ephemeral user so concurrent visitors
    // never share or interfere with each other's topics and quiz sessions.
    Credentials({
      credentials: {
        id: { label: 'ID', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const parsed = demoCredentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const expectedId = process.env.DEMO_LOGIN_ID;
        const expectedPassword = process.env.DEMO_LOGIN_PASSWORD;
        if (!expectedId || !expectedPassword) return null;
        if (parsed.data.id !== expectedId || parsed.data.password !== expectedPassword) {
          return null;
        }

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
