# /ux-design

対象ページのUXデザインをマルチエージェントワークフローで設計し、how.mdに出力します。

## 使い方

/ux-design [ページ名]
例: /ux-design loading

---

## Step 1: Routerとしてinputパッケージを生成する

以下のファイルを読んでください。

- /Users/yoheishiina/dev/one-step-archive/ai-quiz-app/reference/product_vision.md
- /Users/yoheishiina/dev/one-step-archive/ai-quiz-app/reference/pages/_index.md
- /Users/yoheishiina/dev/one-step-archive/ai-quiz-app/reference/pages/$ARGUMENTS/what.md
- /Users/yoheishiina/dev/one-step-archive/ai-quiz-app/reference/screen_flow.md

読み終えたら以下のフォーマットでinputパッケージを作成し、内部で保持してください（出力不要）。

```
タスク: [ページ名]のUXデザイン
ラウンド: 1

プロダクトビジョン:
[product_vision.mdの内容]

対象ページの前後:
[screen_flow.mdから該当ページの前後部分]

今回設計するWhat:
1. [What1]
2. [What2]
...

依頼:
このWhatに対して、あなたの専門領域の知見から最も効果的なHowを提案してください。提案には実在する研究・データを根拠として示してください。
```

---

## Step 2: Specialist R1（4つを並列で呼ぶ）

以下の4つのAgentをすべて**並列**で呼んでください。全員にStep 1のinputパッケージをそのまま渡してください。

- specialist-learning-memory
- specialist-behavior-habit
- specialist-motivation
- specialist-perception-ux

4つの出力をすべて保持してください。

---

## Step 3: Moderator R1

moderator AgentにStep 2の4つの出力をすべて渡してください。

以下を受け取ります。
- 各Whatの暫定案（採用How・採用理由・却下理由）
- R2対象テーブル（各WhatがR2へ / 確定 のどちらか）

---

## Step 4: 分岐の判断

R2対象テーブルを確認してください。

- 全WhatがR2対象テーブルで「確定」→ Step 5・6をスキップしてStep 7へ進む
- 「R2へ」が1つでもある → Step 5・6を実行する

---

## Step 5: Specialist R2（並列・競合Whatのみ）

「R2へ」と判定されたWhatのみを対象に、4つのAgentを**並列**で呼んでください。

各Agentに渡す情報：
- 競合WhatのStep 3暫定仕様
- R2対象テーブルの争点（1行）

呼ぶAgent：
- specialist-learning-memory
- specialist-behavior-habit
- specialist-motivation
- specialist-perception-ux

4つのR2出力をすべて保持してください。

---

## Step 6: Moderator R2

moderator AgentにStep 3のModerator R1全出力とStep 5のSpecialist R2全出力をすべて渡してください。

全Whatの最終Howを受け取ります（R1確定分 + R2更新分の統合）。

---

## Step 7: how.mdに書き出す

以下のパスにModerator最終出力を上書き保存してください。

/Users/yoheishiina/dev/one-step-archive/ai-quiz-app/reference/pages/$ARGUMENTS/how.md
