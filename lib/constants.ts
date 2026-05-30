export const ROUTES = {
  signIn: '/login',
};

// Rolling-window rate limit on new quiz orders: at most ORDER_RATE_LIMIT
// non-failed orders within the trailing ORDER_RATE_LIMIT_WINDOW_MS.
export const ORDER_RATE_LIMIT = 10;
export const ORDER_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const ORDER_RATE_LIMIT_MESSAGE = `You've reached your limit of ${ORDER_RATE_LIMIT} new quizzes per 24 hours. Please try again later.`;

export const LOADING = {
  stepDuration: 3500,
  opacityDuration: 200,
  messages: {
    progress: 'のクイズを作っています',
    steps: ['トピックを分析中...', '問題を生成中...', 'あと少し...'],
  },
};
