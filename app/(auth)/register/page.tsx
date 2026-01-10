import { RegisterForm } from '@/components/forms/register-form';

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10 overflow-hidden">
      {/* Ambient background effects */}
      <div className="pointer-events-none absolute inset-0">
        {/* Primary gradient glow - top right */}
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        {/* Secondary gradient glow - bottom left */}
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        {/* Center accent orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/[0.03] blur-3xl" />
      </div>
      
      {/* Subtle star pattern overlay */}
      <div className="pointer-events-none absolute inset-0 bg-stars opacity-40 dark:opacity-60" />
      
      <div className="relative w-full max-w-sm">
        <RegisterForm />
      </div>
    </div>
  );
}
