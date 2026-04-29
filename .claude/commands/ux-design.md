# /ux-design

対象ページのUXデザインをマルチエージェントワークフローで設計し、how.mdに出力します。

## 使い方

/ux-design

---

## Step 0: ページ選択

以下のファイルを読んでください。

- /Users/yoheishiina/dev/one-step-archive/ai-quiz-app/reference/pages/_index.md

ページ一覧を番号付きリストで表示し、「どのページを設計しますか？」とユーザーに聞いてください。
ユーザーの返答（番号・ページ名・別名どれでも可）から正規のページディレクトリ名を特定し、それを PAGE_NAME として以降のステップで使ってください。

---

## Step 1: Routerとしてinputパッケージを生成する

以下のファイルを読んでください。

- /Users/yoheishiina/dev/one-step-archive/ai-quiz-app/reference/product_vision.md
- /Users/yoheishiina/dev/one-step-archive/ai-quiz-app/reference/pages/{PAGE_NAME}/what.md
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
（what.md のうち `[tech]` タグが付いていないものだけを番号付きで列挙する）
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

moderator Agentに以下を渡してください。

- プロダクトビジョン（product_vision.mdの内容）
- Step 2の4つの出力すべて

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
- プロダクトビジョン（product_vision.mdの内容）
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

moderator Agentに以下のみを渡してください。

- プロダクトビジョン（product_vision.mdの内容）
- 「R2へ」と判定された What の Step 3 暫定仕様（確定 What は含めない）
- Step 5 の Specialist R2 全出力

競合 What の最終 How を受け取ります。

---

## Step 7: how.mdに書き出す

以下を合成して上書き保存してください。

- Step 3 で「確定」となった What の暫定案（R1 最終）
- Step 6 で更新された What の最終案（R2 最終）

保存先：

/Users/yoheishiina/dev/one-step-archive/ai-quiz-app/reference/pages/{PAGE_NAME}/how.md

### how.md の出力フォーマット

```
# How — [ページ名] ([route])

---

## What[N]: [実装者向けに意訳した見出し]

**仕様:**
- [箇条書き。数値・文言・アニメーション時間など具体的に]

**確定理由:**
[R1全員合意 / R2で確定 など経緯を1行。採用理由を2文以内（引用は `著者名(年)` + 結論1行のみ）。却下した選択肢がある場合は末尾に「〇〇案（却下）：[理由1行]」を追記]

---
```
