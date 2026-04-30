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

## Step 1: inputパッケージを生成する

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

## Step 3: 競合フラグを読んでルーティングする

Step 2の4つの出力を読み、各Whatの**競合フラグ**を確認してください。

```
全Whatの競合フラグが「なし」
  → 全What確定。Step 4はスキップしてStep 5へ進む

1つでも「なし」以外の競合フラグがある
  → そのWhatをR2対象とし、競合フラグから争点を1行で抽出する
  → Step 4を実行する
```

---

## Step 4: Specialist R2（R2対象Whatがある場合のみ）

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

Step 4完了後、R2対象Whatごとに以下の判定を行ってください。
両者の**推奨仕様**の箇条書きを比較し、数値・要素に矛盾がなければ合意とみなします。

```
両者の推奨仕様に矛盾がない
  → そのWhatを「R2合意確定」とする
  → 両者の推奨仕様の共通項から**仕様:**を箇条書きで作成し、
     どちらか一方の**根拠:**を**採用理由:**として使用し、
     how.mdフォーマットであなたが直接記述する（Moderatorへは渡さない）

矛盾または優劣が不明
  → そのWhatを「Moderator判定要」とする
```

---

## Step 5: Moderatorへの入力を構造化する

R1確定WhatおよびModerator判定要WhatについてModeratorへの入力を作成してください。
各Specialistの出力から**提案・仕様・根拠**フィールドのみを抜き出し、以下のフォーマットに変換してModeratorに渡してください。

【Moderatorへの入力フォーマット】

```
以下のWhatについて確定案を出してください。

プロダクトビジョン: [...]
対象ページの前後: [...]

## What[N]: [What内容]
選択肢:
- [specialist名]: [提案1文] | 仕様: [核心1〜2点] | 根拠: 著者(年)—1行
- [specialist名]: ...
争点: [なし / 1行]

## What[M]: [What内容]（Moderator判定要の場合）
争点: [1行]
R2提案:
- [specialist名]: [賛否] | 推奨仕様: [核心1〜2点] | 根拠: 著者(年)—1行
- [specialist名]: ...
```

全WhatがR2合意確定の場合はModeratorへの入力は不要。Step 6をスキップしてStep 7へ進む。

---

## Step 6: Moderator（Moderator判定要のWhatがある場合 / 全WhatがR1確定の場合）

Step 5で作成した入力パッケージをModerator Agentに渡し、確定案を出させてください。

【出力フォーマット（厳守）】
渡されたWhatのみ出力すること。前置き・後記・他のWhatへの言及は書かないこと。

```
## What[N]: [実装者向けの見出し]

**仕様:**
- [箇条書き。数値・文言・時間など具体的に]

**採用理由:** 著者(年) — [結論1行] / [なぜこの案か1行]
**却下案:** [案名：理由1行]（なければ省略）
```

---

## Step 7: how.mdに書き出す

以下を元のWhat番号順に並べてhow.mdに上書き保存してください。

- Step 6 Moderatorが出した確定案（R1確定What・Moderator判定要What）
- Step 4であなたが記述した「R2合意確定」Whatの確定案

各Whatの**採用理由:**末尾に、以下のルールで括弧付きタグを1つ追記してください。
- `（R1確定）`：R1の競合フラグが全員「なし」だったWhat
- `（R2確定）`：R2を経てModeratorが確定したWhat
- `（R2合意確定）`：R2 Specialistが合意しあなたが記述したWhat

保存先：/Users/yoheishiina/dev/one-step-archive/ai-quiz-app/reference/pages/{PAGE_NAME}/how.md

冒頭に `# How — [ページ名] ([route])` を付けて保存してください。各Whatの区切りに `---` を挿入してください。
