# boost_mode — TyranoScript Ver6 対応 テキスト高速表示プラグイン

旧サイト `studio-overdrive.com` で配布されていた Studio Overdrive 製
`boost_mode` プラグインを、TyranoScript Ver6 で動作するように移植したものです。

## 原版との違い

原版（Ver2.74 向け、`original/` に保存）は `tyrano.plugin.kag.tag.text.showMessage`
および `showMessageVertical` を旧エンジンの内部実装で丸ごと上書きする方式でした。
Ver6 ではテキスト描画パイプラインが全面的に書き換えられており、その方式では
以下の問題が発生します。

- `stat.ch_speed` が `""` のままなので通常表示まで瞬間表示化する
- 縦書きが横書き化する（`showMessageVertical` は呼ばれない死にコード）
- グリフ画像パス（`tyrano/images/kag/`）が存在せず broken image になる
- 装飾・禁則処理・バックログ名・リップシンク等の Ver6 機能がすべて失われる

本版は `tag.text.addChars` のみを実行時にラップする最小介入型です。
エンジン本体のファイル（`tyrano/` 以下）は一切変更せず、装飾・縦書き・
バックログ・グリフ・`[l]`/`[p]` 待機はすべて本家の処理がそのまま使われます。

あわせて、本家の即時表示分岐（`[nowait]` / `ch_speed<=3` も通る）にある
以下の問題を boost_mode 経路では回避しています。

- メッセージウィンドウ非表示中に `nextOrder` が捨てられ停滞しうる問題
  （`finishAddingChars` 経由にして `messagewindow-show` で復帰）
- スキップ以外にも一律で `skipSpeed`（30ms）の遅延が乗る問題

## ファイル構成

```
data/
  others/boost_mode/boost_mode.js      ... プラグイン本体
  scenario/boost_mode/boost_mode.ks    ... マクロ定義・読み込み用シナリオ
original/                               ... 原版（Ver2.74 向け）の保存
```

## 使い方

`data/` をゲームプロジェクトにコピーしたあと、シナリオの最初で読み込みます。

```
[call storage="boost_mode/boost_mode.ks"]
```

以降、シナリオ内の任意の位置で切り替えられます。

```
[boost_mode_on]   ;テキストを一括描画ON
[boost_mode_off]  ;テキストを一括描画OFF（通常の1文字ずつ表示）
```

## 動作確認環境

- TyranoScript Ver6.00（ShikemokuMK/tyranoscript master 2026-02 時点）

## 備考

- スキップ中は本家のスキップ処理に委譲します（skipSpeed のペーシングを維持）。
- `is_boost_mode` フラグはセーブデータに含まれません。
- 名前空間は原版同様 `sutdioOverdrive`（タイポ含む）を維持しつつ、
  修正綴り `studioOverdrive` でも参照できるエイリアスを用意しています。

## クレジット

- 原版: Studio Overdrive（http://studio-overdrive.com/ 、現存せず）
- 原版ソースの参照元（第三者公開リポジトリ）:
  - https://github.com/fumibako/script/blob/d1f09ea2cceedb3b456d84179ee3c3293e7ea394/play/data/scenario/boost_mode/boost_mode.ks
  - https://github.com/fumibako/script/blob/d1f09ea2cceedb3b456d84179ee3c3293e7ea394/play/data/others/boost_mode/boost_mode.js

原版のライセンス条項は確認できていません。本移植版は原版へのクレジットを
残したうえで、Ver6 向けに実装を全面的に書き換えた派生物です。
再配布・商用利用の際は原版の権利関係にご注意ください。
