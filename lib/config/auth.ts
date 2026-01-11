import { NextAuthOptions } from 'next-auth';
import { Adapter } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from './db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          return null;
        }

        // For OAuth users without password, deny credentials login
        if (!user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Save Google profile picture to user.image when signing in with OAuth
      if (account?.provider === 'google' && user.id) {
        const googleProfile = profile as { picture?: string } | undefined;
        if (googleProfile?.picture) {
          try {
            await db.user.update({
              where: { id: user.id },
              data: { image: googleProfile.picture },
            });
          } catch {
            // User might not exist yet (first sign-in), adapter will handle it
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile, trigger }) {
      if (user) {
        token.id = user.id;
      }
      // Store Google profile picture in token for first sign-in
      if (account?.provider === 'google' && profile) {
        const googleProfile = profile as { picture?: string };
        if (googleProfile.picture) {
          token.picture = googleProfile.picture;
        }
      }
      // Fetch onboarding status from database when:
      // 1. Initial sign-in (user present)
      // 2. Session update trigger
      // 3. Token doesn't have onboardingCompleted set (old tokens)
      const shouldRefreshFromDb = 
        user || 
        trigger === 'update' || 
        token.onboardingCompleted === undefined;
      
      if (shouldRefreshFromDb && token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { onboardingCompleted: true, emailVerified: true },
        });
        token.onboardingCompleted = dbUser?.onboardingCompleted ?? false;
        token.emailVerified = !!dbUser?.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
  },
  events: {
    // Update user's Google image on each sign-in
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.id) {
        const googleProfile = profile as { picture?: string } | undefined;
        if (googleProfile?.picture) {
          try {
            await db.user.update({
              where: { id: user.id },
              data: { image: googleProfile.picture },
            });
          } catch (error) {
            // Silently fail - user image update is not critical
            console.error('Failed to update Google profile image:', error);
          }
        }
      }
    },
  },
  pages: {
    signIn: '/login',
  },
};

