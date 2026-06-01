import type { Locale } from '@/lib/i18n/config';

const en = {
  appName: 'AI Quiz',
  settings: {
    language: 'Language',
  },
  home: {
    emptyTitlePre: 'What are you ',
    emptyTitleEm: 'curious',
    emptyTitlePost: ' about?',
    emptyDesc: "Type a topic and we'll build a quiz in seconds.",
    collectionTitle: 'Your collection',
    topicsCount: (n: number) => `${n} topics`,
  },
  topicForm: {
    placeholder: 'Add a topic...',
    submit: 'Go',
  },
  login: {
    title: 'AI Quiz App',
    subtitle: 'Test your knowledge with AI-generated quizzes',
    welcome: 'Welcome',
    prompt: 'Sign in with Google to continue',
    signIn: 'Sign in with Google',
  },
  error: {
    title: 'Something went wrong!',
    retry: 'Try again',
  },
  loading: {
    progress: 'Building your quiz',
    steps: ['Analyzing the topic...', 'Generating questions...', 'Almost there...'],
  },
  answering: {
    leave: 'Leave quiz',
    notTheTopic: 'Not the topic you meant? ',
    tryDifferent: 'Try a different wording',
    right: 'Right',
    theAnswerWas: 'The answer was',
    finish: 'Finish',
    next: 'Next question',
    preparingNext: 'Preparing next…',
    preparingNextQuestion: 'Preparing next question…',
  },
  result: {
    onTopic: (topic: string) => `on “${topic}”`,
    youGotPre: 'You got ',
    score: (score: number, total: number) => `${score} of ${total}`,
    youGotPost: '.',
    whatYouMissed: 'What you missed',
    missesCount: (n: number) => `${n} ${n === 1 ? 'question' : 'questions'}`,
    perfect: 'Perfect.',
    nothingToReview: 'Nothing to review on this round.',
    questionLabel: (n: number) => `Question ${n}`,
    yourAnswer: 'Your answer',
    correct: 'Correct',
    tryAnother: 'Try another round',
    backToCollection: 'Back to your collection',
  },
  validation: {
    topicRequired: 'Topic is required',
    rateLimit: (limit: number) =>
      `You've reached your limit of ${limit} new quizzes per 24 hours. Please try again later.`,
  },
};

type Dictionary = typeof en;

const ja: Dictionary = {
  appName: 'AIクイズ',
  settings: {
    language: '言語',
  },
  home: {
    emptyTitlePre: '今、何が',
    emptyTitleEm: '気になる',
    emptyTitlePost: '？',
    emptyDesc: 'トピックを入力すれば、数秒でクイズを作ります。',
    collectionTitle: 'あなたのコレクション',
    topicsCount: (n: number) => `${n}件のトピック`,
  },
  topicForm: {
    placeholder: 'トピックを追加...',
    submit: '作成',
  },
  login: {
    title: 'AIクイズアプリ',
    subtitle: 'AIが生成するクイズで知識を試そう',
    welcome: 'ようこそ',
    prompt: 'Googleでサインインして続ける',
    signIn: 'Googleでサインイン',
  },
  error: {
    title: '問題が発生しました',
    retry: 'もう一度試す',
  },
  loading: {
    progress: 'のクイズを作っています',
    steps: ['トピックを分析中...', '問題を生成中...', 'あと少し...'],
  },
  answering: {
    leave: 'クイズを終了',
    notTheTopic: '意図したトピックと違う？ ',
    tryDifferent: '別の言い方を試す',
    right: '正解',
    theAnswerWas: '正解は',
    finish: '完了',
    next: '次の問題',
    preparingNext: '次を準備中…',
    preparingNextQuestion: '次の問題を準備中…',
  },
  result: {
    onTopic: (topic: string) => `「${topic}」`,
    youGotPre: '',
    score: (score: number, total: number) => `${total}問中${score}問`,
    youGotPost: ' 正解。',
    whatYouMissed: '間違えた問題',
    missesCount: (n: number) => `${n}問`,
    perfect: '完璧。',
    nothingToReview: 'このラウンドで復習する問題はありません。',
    questionLabel: (n: number) => `問題 ${n}`,
    yourAnswer: 'あなたの回答',
    correct: '正解',
    tryAnother: 'もう一度挑戦',
    backToCollection: 'コレクションに戻る',
  },
  validation: {
    topicRequired: 'トピックを入力してください',
    rateLimit: (limit: number) =>
      `24時間あたりの新規クイズ作成の上限（${limit}件）に達しました。しばらくしてからお試しください。`,
  },
};

const dictionaries: Record<Locale, Dictionary> = { en, ja };

export type { Dictionary };
export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];
