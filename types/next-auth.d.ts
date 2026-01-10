import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      onboardingCompleted: boolean;
      emailVerified: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    onboardingCompleted?: boolean;
    emailVerified?: boolean;
  }
}


