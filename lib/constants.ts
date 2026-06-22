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

// Rolling-window rate limit on quiz generation: at most QUIZ_GENERATION_RATE_LIMIT
// non-failed events within the trailing QUIZ_GENERATION_RATE_LIMIT_WINDOW_MS.
export const QUIZ_GENERATION_RATE_LIMIT = 10;
export const QUIZ_GENERATION_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

// User-facing text lives in lib/i18n/dictionaries.ts; this holds timing only.
export const LOADING = {
  stepDuration: 3500,
  opacityDuration: 200,
};
