export const ROUTES = {
  home: '/',
  signIn: '/login',
  quiz: {
    new: '/quiz/new',
  },
};

export const LOADING = {
  stepDuration: 3500,
  opacityDuration: 200,
  messages: {
    progress: 'のクイズを作っています',
    steps: ['トピックを分析中...', '問題を生成中...', 'あと少し...'],
  },
};

export const QUIZ = {
  title: 'New Quiz',
  new: {
    topic: {
      label: 'TOPIC',
      placeholder: `e.g. "Why the moon doesn't fall to Earth"`,
    },
    wordSense: {
      label: 'Which do you mean?',
      placeholder: 'Type your own...',
    },
    context: {
      label: 'Pick an angle',
      placeholder: 'Or describe the angle yourself',
    },
    questionCount: {
      label: 'Questions',
      choices: [5, 10, 15, 20],
    },
  },
};
