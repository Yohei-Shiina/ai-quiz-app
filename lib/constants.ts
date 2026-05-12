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
      name: 'topic',
      placeholder: `e.g. "Why the moon doesn't fall to Earth"`,
    },
    sense: {
      label: 'Which do you mean?',
      name: 'sense',
      placeholder: 'Type your own...',
    },
    angle: {
      label: 'Pick an angle',
      name: 'angle',
      placeholder: 'Or describe the angle yourself',
    },
    questionCount: {
      label: 'Questions',
      name: 'count',
      choices: [5, 10, 15, 20],
    },
  },
};
