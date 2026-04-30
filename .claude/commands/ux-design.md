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
このWhatに対して、あなたの専門領域の知見から最も効果的なHowを提案してください。

【出力フォーマット（厳守）】
各Whatについて以下の形式のみで出力すること。段落説明・前置き・後記は書かないこと。

## What[N]
**提案:** [方向性を1文で]
**仕様:** [数値・具体的な要素を3箇条以内]
**根拠:** 著者(年) — [結論1行]
**競合:** [他の専門家と見解が割れそうな点を1行。なければ「なし」]
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

## Step 3: CCが競合フラグを読んでR2判定する

Step 2の4つの出力を自分で読み、各Whatの**競合フラグ**を確認してください。

```
全Whatの競合フラグが「なし」
  → 全What確定。Step 4Aのみ実行（Step 4B・Step 5はスキップ）

1つでも「なし」以外の競合フラグがある
  → そのWhatをR2対象とし、競合フラグから争点を1行で抽出する
  → Step 4A・4Bを並列で実行する
```

---

## Step 4: 並列実行

以下のA・Bを**同時に**起動してください。

### 4A: Moderator（確定Whatの確定案）

確定WhatのみModerator Agentに渡し、確定案を出させてください。

渡す情報：
- プロダクトビジョン
- 対象ページの前後
- 確定WhatのWhat内容と、対応するSpecialist R1出力（4人分）

R2対象WhatのSpecialist出力は渡さないこと。

【Moderatorへの命令フォーマット（厳守）】
```
以下のWhatについて確定案を出してください。

プロダクトビジョン: [...]
対象ページの前後: [...]

[WhatNの内容]
[WhatNに対するSpecialist R1の出力（4人分）]

【出力フォーマット（厳守）】
渡されたWhatのみ出力すること。
R2の結論・他のWhatへの言及・R2テーブルは絶対に出力しないこと。

## What[N]: [実装者向けの見出し]
**仕様:** [3箇条以内、数値・文言・時間など具体的に]
**採用理由:** 著者(年) — [結論1行] / [なぜこの案か1行]
**却下案:** [案名：理由1行]（なければ省略）
```

### 4B: Specialist R2（R2対象Whatがある場合のみ）

R2対象Whatがある場合のみ実行する。

競合フラグを出した2専門家を選んで**並列**で呼ぶ。
- 競合フラグで最も対立している2人を選ぶ
- 判断できない場合は specialist-perception-ux と specialist-behavior-habit をデフォルトとする

各Agentに渡す情報：
- プロダクトビジョン
- 対象ページの前後
- R2対象WhatのWhat内容
- 争点（Step 3で抽出した1行）
- R2対象WhatのSpecialist R1出力（4人分）

【出力フォーマット（厳守）】
各R2対象Whatについて以下の形式のみで出力すること。段落説明・前置き・後記は書かないこと。

```
## What[N]
**賛否:** [R1提案を支持 / 第3案を推奨]
**推奨仕様:** [数値・具体的な要素を3箇条以内]
**根拠:** 著者(年) — [結論1行]
**理由:** [変更点または維持理由を1文]
```

---

## Step 5: Moderator R2（R2対象Whatがある場合のみ）

Step 4A・4Bの両方が完了してから実行する。

R2対象WhatのみModerator Agentに渡し、確定案を出させてください。

渡す情報：
- プロダクトビジョン
- 対象ページの前後
- R2対象WhatのWhat内容
- 争点（1行）
- Step 4BのSpecialist R2出力（2人分）

命令フォーマットはStep 4Aと同一。

---

## Step 6: how.mdに書き出す

以下を合成して上書き保存してください。

- Step 4A Moderatorが出した確定案（確定What分）
- Step 5 Moderatorが出した確定案（R2対象What分、あれば）

保存先：

/Users/yoheishiina/dev/one-step-archive/ai-quiz-app/reference/pages/{PAGE_NAME}/how.md

### how.md の出力フォーマット

ModeratorのWhat単位の出力をそのまま並べ、冒頭にページ見出しを付ける。
経緯（R1確定 / R2確定）はCCが自動で付与する。

```
# How — [ページ名] ([route])

---

## What[N]: [実装者向けに意訳した見出し]

**仕様:**
- [箇条書き。数値・文言・アニメーション時間など具体的に]

**採用理由:** 著者(年) — [結論1行] / [なぜこの案か1行]（R1確定 または R2確定）
**却下案:** [案名：理由1行]（なければ省略）

---
```
