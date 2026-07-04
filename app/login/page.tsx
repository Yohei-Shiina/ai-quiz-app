import { signIn } from '@/auth';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getDict } from '@/lib/i18n/server';

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

async function handleSignIn() {
  'use server';
  await signIn('google', { redirectTo: '/' });
}

// Passwordless demo login: the Credentials provider needs no input, so the button
// just triggers sign-in and lands on the home page (auth.ts mints the demo user).
async function handleDemoSignIn() {
  'use server';
  await signIn('credentials', { redirectTo: '/' });
}

export default async function LoginPage() {
  const t = await getDict();
  return (
    <main className="h-dvh flex flex-col justify-center items-center px-4">
      <div className="flex flex-col w-full max-w-md gap-8">
        <div className="flex flex-col items-center gap-2.5">
          <Logo />
          <h1 className="text-2xl font-bold text-foreground">{t.login.title}</h1>
          <p className="text-sm text-muted-foreground">{t.login.subtitle}</p>
        </div>
        <Card className="py-6">
          <CardHeader className="px-6">
            <CardTitle>{t.login.welcome}</CardTitle>
          </CardHeader>
          <CardContent className="px-6 flex flex-col gap-6">
            <form action={handleSignIn}>
              <Button type="submit" size="lg" variant="outline" className="w-full">
                <GoogleIcon />
                {t.login.signIn}
              </Button>
            </form>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t.login.orDivider}</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form action={handleDemoSignIn} className="flex flex-col gap-2.5">
              <Button type="submit" size="lg" variant="secondary" className="w-full">
                {t.login.demoSignIn}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
