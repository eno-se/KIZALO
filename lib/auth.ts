import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      const u = user as { displayName?: string | null; isBanned?: boolean; isSuspended?: boolean };
      session.user.id = user.id;
      session.user.displayName = u.displayName ?? null;
      session.user.isSuspended = !!(u.isBanned || u.isSuspended);
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
