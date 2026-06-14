export const ROUTES = {
  home: '/',
  signIn: '/login',
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
