export const ROUTES = {
  home: '/',
  signIn: '/login',
};

// Portfolio demo login. Each credentials sign-in mints a unique ephemeral user
// (email `${prefix}<uuid>@${domain}`) so concurrent visitors get isolated data.
// The cleanup script (scripts/cleanup-demo-users.ts) matches users by this pattern.
export const DEMO_USER = {
  emailPrefix: 'demo-',
  emailDomain: 'demo.local',
  name: 'Demo User',
};

// True when an email is an ephemeral demo account minted in auth.ts.
export const isDemoEmail = (email: string): boolean =>
  email.startsWith(DEMO_USER.emailPrefix) && email.endsWith(`@${DEMO_USER.emailDomain}`);

// Non-demo (Google) users: rolling-window rate limit on quiz generation — at most
// QUIZ_GENERATION_RATE_LIMIT non-failed events within the trailing window.
export const QUIZ_GENERATION_RATE_LIMIT = 10;
export const QUIZ_GENERATION_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

// Demo users only. Passwordless login makes accounts free to remint, so two caps
// apply together: a per-account lifetime cap (soft nudge) and a global rolling
// window across all demo users (the real cost guard on public generation).
export const DEMO_QUIZ_GENERATION_PER_ACCOUNT_LIMIT = 3;
export const DEMO_QUIZ_GENERATION_GLOBAL_LIMIT = 50;
export const DEMO_QUIZ_GENERATION_GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000;

// User-facing text lives in lib/i18n/dictionaries.ts; this holds timing only.
export const LOADING = {
  stepDuration: 3500,
  opacityDuration: 200,
};
