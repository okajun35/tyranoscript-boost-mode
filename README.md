# boost_mode — TyranoScript Ver6 対応 テキスト高速表示プラグイン

かつて `studio-overdrive.com` で配布していた Studio Overdrive 製
`boost_mode` プラグインを、作者本人が TyranoScript Ver6 向けに
作り直したものです。テキストを一括表示するモードを `[boost_mode_on]` /
`[boost_mode_off]` で切り替えられます。

## 実装方式

旧版（Ver2.74 向け）は `showMessage` を旧エンジンの内部実装で丸ごと
上書きしていましたが、本版は `tag.text.addChars`（常時一括表示）と
`tag.text.addOneChar`（表示中クリック一括表示オプション）を実行時に
ラップする最小介入型です。エンジン本体のファイルは一切変更せず、
装飾・縦書き・バックログ・グリフ・`[l]`/`[p]` 待機は本家の処理が
そのまま使われます。

あわせて、本家の即時表示分岐（`[nowait]` / `ch_speed<=3` も通る）にある
以下の問題を本プラグイン経路では回避しています。

- メッセージウィンドウ非表示中に `nextOrder` が捨てられ停滞しうる問題
  （`finishAddingChars` 経由にして `messagewindow-show` で復帰）
- スキップ以外にも一律で `skipSpeed`（30ms）の遅延が乗る問題

## ファイル構成

```
data/
  others/boost_mode/boost_mode.js      ... プラグイン本体
  scenario/boost_mode/boost_mode.ks    ... マクロ定義・読み込み用シナリオ
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

### オプション: 表示中クリックの一括表示（Ver5 相当）

```
[boost_mode_click_on]   ;表示中クリックで残り文字を一括表示
[boost_mode_click_off]  ;本家の挙動（残り文字を高速表示）に戻す
```

本家 Ver6 では、テキスト表示中のクリックは残り文字を `ch_speed_in_click`
（既定 1ms）で逐次表示する「マッハ表示」になります。`[boost_mode_click_on]`
を有効にすると、Ver5 と同じくクリック時点で残り全文字が即時表示され、
内部の逐次表示ループもその場で終了します（即座にクリック待ちへ移行する
ため、続けてクリックしても取りこぼされません）。
`boost_mode_on` 中は行が最初から一括表示されるため、本オプションが効果を
持つのは通常速度の行です。

## 動作確認環境

- TyranoScript Ver6.00（ShikemokuMK/tyranoscript master 2026-02 時点）

## 備考

- スキップ中は本家のスキップ処理に委譲します（skipSpeed のペーシングを維持）。
- `is_boost_mode` / `is_boost_mode_click` フラグはセーブデータに含まれません。

## ライセンス

MIT License（LICENSE 参照）
